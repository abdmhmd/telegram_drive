import { TelegramClient } from 'telegram/index.js';
import { StringSession } from 'telegram/sessions/index.js';
import { Api } from 'telegram/tl/index.js';
import { CustomFile } from 'telegram/client/uploads.js';
import { PassThrough } from 'stream';
import path from 'path';
import logger from '../config/logger.js';
import fs from 'fs';

function serializeFileReference(fileReference) {
  if (fileReference === null || fileReference === undefined) return null;
  if (Buffer.isBuffer(fileReference) || fileReference instanceof Uint8Array) {
    return Buffer.from(fileReference).toString('base64');
  }
  if (typeof fileReference === 'object' && typeof fileReference.value !== 'undefined') {
    return serializeFileReference(fileReference.value);
  }
  if (typeof fileReference === 'number') {
    return String(fileReference);
  }
  return String(fileReference);
}

class TelegramService {
  constructor() {
    this.clients = new Map();
    this.verifyStates = new Map();
  }

  async getClient(phone) {
    const entry = this.clients.get(phone);
    if (entry) {
      try {
        await entry.client.connect();
        return entry.client;
      } catch {
        this.clients.delete(phone);
      }
    }
    return null;
  }

  async loadSession(phone, sessionString, apiId, apiHash) {
    try {
      const client = new TelegramClient(
        new StringSession(sessionString),
        Number(apiId),
        apiHash,
        {
          connectionRetries: 5,
          useWSS: true,
        }
      );
      await client.connect();
      const me = await client.getMe();
      logger.info(`Session loaded for ${me.phone || phone}`);
      this.clients.set(phone, { client, apiId, apiHash });
      return client;
    } catch (err) {
      logger.error(`Failed to load session for ${phone}:`, err.message);
      throw err;
    }
  }

  async sendCode(phone, apiId, apiHash) {
    const client = new TelegramClient(
      new StringSession(''),
      Number(apiId),
      apiHash,
      { connectionRetries: 5, useWSS: true }
    );
    await client.connect();

    const result = await client.invoke(
      new Api.auth.SendCode({
        phoneNumber: phone,
        apiId: Number(apiId),
        apiHash: apiHash,
        settings: new Api.CodeSettings({
          allowFlashcall: false,
          currentNumber: true,
          allowAppHash: false,
        }),
      })
    );

    this.verifyStates.set(phone, {
      client,
      apiId,
      apiHash,
      phoneCodeHash: result.phoneCodeHash,
      timeout: setTimeout(() => {
        this.verifyStates.delete(phone);
        client.destroy();
      }, 300000),
    });

    logger.info(`Verification code sent to ${phone}`);
    return true;
  }

  async verifyCode(phone, code) {
    const state = this.verifyStates.get(phone);
    if (!state) {
      throw new Error('No verification in progress. Please request a code first.');
    }

    clearTimeout(state.timeout);

    try {
      await state.client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash: state.phoneCodeHash,
          phoneCode: String(code),
        })
      );
    } catch (err) {
      if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
        return { needPassword: true, phone };
      }
      this.verifyStates.delete(phone);
      state.client.destroy();
      throw err;
    }

    const sessionString = state.client.session.save();
    this.clients.set(phone, { client: state.client, apiId: state.apiId, apiHash: state.apiHash });
    this.verifyStates.delete(phone);
    logger.info(`Phone ${phone} verified successfully`);
    return { sessionString, phone, apiId: state.apiId, apiHash: state.apiHash };
  }

  async verify2FA(phone, password) {
    const state = this.verifyStates.get(phone);
    if (!state) {
      throw new Error('No verification in progress');
    }

    clearTimeout(state.timeout);

    const { computeCheck } = await import('telegram/Password.js');
    const check = await computeCheck(state.client, password);

    await state.client.invoke(
      new Api.auth.CheckPassword({ password: check })
    );

    const sessionString = state.client.session.save();
    this.clients.set(phone, { client: state.client, apiId: state.apiId, apiHash: state.apiHash });
    this.verifyStates.delete(phone);
    logger.info(`Phone ${phone} verified with 2FA successfully`);
    return { sessionString, phone, apiId: state.apiId, apiHash: state.apiHash };
  }

  async uploadFile(phone, filePath, fileName, mimeType, fileSize, progressCb) {
    const client = await this.getClient(phone);
    if (!client) throw new Error('Telegram client not connected');

    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found at path: ${resolvedPath}`);
    }

    const toUpload = new CustomFile(fileName, fileSize, resolvedPath);
    const uploadResult = await client.uploadFile({
      file: toUpload,
      workers: 5,
      fileSize: fileSize || undefined,
      progressCallback: progressCb,
    });

    const randomId = BigInt(Date.now()) * BigInt(1000) + BigInt(Math.floor(Math.random() * 1000));

    const result = await client.invoke(
      new Api.messages.SendMedia({
        peer: 'me',
        media: new Api.InputMediaUploadedDocument({
          file: uploadResult,
          mimeType: mimeType || 'application/octet-stream',
          attributes: [
            new Api.DocumentAttributeFilename({ fileName: fileName }),
            ...(mimeType?.startsWith('image/')
              ? [new Api.DocumentAttributeImageSize({ w: 0, h: 0 })]
              : []),
          ],
          forceFile: true,
        }),
        message: fileName,
        randomId,
      })
    );

    const msg = result?.updates?.[0];
    const messageId = msg?.id;
    if (!messageId) {
      throw new Error('Failed to get message ID after upload');
    }

    const sentMsg = await this.getMessage(phone, messageId);
    if (!sentMsg?.media) {
      throw new Error('Upload verification failed: message has no media');
    }

    const doc = sentMsg.media.document || sentMsg.media;
    return {
      telegramMessageId: messageId,
      documentId: doc.id?.toString(),
      accessHash: doc.accessHash?.toString(),
      fileReference: serializeFileReference(doc.fileReference),
      dcId: doc.dcId,
    };
  }

  async getMessage(phone, messageId) {
    const client = await this.getClient(phone);
    if (!client) throw new Error('Telegram client not connected');

    const result = await client.invoke(
      new Api.messages.GetMessages({
        peer: 'me',
        id: [Number(messageId)],
      })
    );
    return result.messages[0];
  }

  async downloadFile(phone, messageId) {
    const client = await this.getClient(phone);
    if (!client) throw new Error('Telegram client not connected');

    const msg = await this.getMessage(phone, messageId);
    if (!msg?.media) throw new Error('Message has no media');

    const buffer = await client.downloadMedia(msg.media, {});
    return buffer;
  }

  async downloadFileStream(phone, messageId) {
    const client = await this.getClient(phone);
    if (!client) throw new Error('Telegram client not connected');

    const msg = await this.getMessage(phone, messageId);
    if (!msg?.media) throw new Error('Message has no media');

    const stream = new PassThrough();
    client.downloadMedia(msg.media, { outputFile: stream }).catch((err) => {
      if (!stream.destroyed) {
        stream.destroy(err);
      }
    });
    return stream;
  }

  async deleteFile(phone, messageId) {
    const client = await this.getClient(phone);
    if (!client) throw new Error('Telegram client not connected');

    await client.invoke(
      new Api.messages.DeleteMessages({
        peer: 'me',
        id: [Number(messageId)],
      })
    );
  }
}

export default new TelegramService();
