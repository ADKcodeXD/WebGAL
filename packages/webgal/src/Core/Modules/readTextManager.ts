import { IReadTextRecord } from '@/store/userDataInterface';
import { webgalStore } from '@/store/store';
import { WebGAL } from '@/Core/WebGAL';

export class ReadTextManager {
  private static instance: ReadTextManager;

  public static getInstance(): ReadTextManager {
    if (!ReadTextManager.instance) {
      ReadTextManager.instance = new ReadTextManager();
    }
    return ReadTextManager.instance;
  }

  private constructor() {}

  /**
   * 记录已读文本
   * @param text 文本内容
   */
  public recordReadText(text: string) {
    const currentScene = WebGAL.sceneManager.sceneData.currentScene;
    const currentSentenceId = WebGAL.sceneManager.sceneData.currentSentenceId;

    const record: IReadTextRecord = {
      sceneName: currentScene.sceneName,
      sceneUrl: currentScene.sceneUrl,
      sentenceId: currentSentenceId,
      text: this.generateTextHash(text), // 使用哈希值替代完整文本
      timestamp: Date.now(),
    };

    // 检查是否已经记录过相同的文本
    const existingRecord = this.findExistingRecord(record);
    if (!existingRecord) {
      const currentRecords = webgalStore.getState().userData.readTextRecords;
      webgalStore.dispatch({
        type: 'userData/setReadTextRecords',
        payload: [...currentRecords, record],
      });
    }
  }

  /**
   * 检查文本是否已读
   * @param record 包含场景信息和文本的记录
   * @returns 是否已读
   */
  public isTextRead(record: Omit<IReadTextRecord, 'timestamp'>): boolean {
    const textHash = this.generateTextHash(record.text);
    return this.findExistingRecord({ ...record, text: textHash, timestamp: 0 }) !== undefined;
  }

  /**
   * 获取已读文本记录
   * @returns 已读文本记录数组
   */
  public getReadTextRecords(): IReadTextRecord[] {
    return webgalStore.getState().userData.readTextRecords;
  }

  /**
   * 清除已读文本记录
   */
  public clearReadTextRecords() {
    webgalStore.dispatch({
      type: 'userData/setReadTextRecords',
      payload: [],
    });
  }

  /**
   * 生成文本的哈希值
   * @param text 文本内容
   * @returns 哈希值
   */
  private generateTextHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16); // Convert to hex string
  }

  private findExistingRecord(record: IReadTextRecord): IReadTextRecord | undefined {
    const records = this.getReadTextRecords();
    return records.find(
      (r) =>
        r.sceneName === record.sceneName &&
        r.sceneUrl === record.sceneUrl &&
        r.sentenceId === record.sentenceId &&
        r.text === record.text,
    );
  }
}
