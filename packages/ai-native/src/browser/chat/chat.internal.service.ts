import { Autowired, Injectable } from '@opensumi/di';
import { PreferenceService } from '@opensumi/ide-core-browser';
import {
  AIBackSerivcePath,
  CancelResponse,
  CancellationTokenSource,
  Disposable,
  Emitter,
  ErrorResponse,
  Event,
  IAIBackService,
  IAIBackServiceOption,
  ReplyResponse,
} from '@opensumi/ide-core-common';

import { IChatManagerService } from '../../common';

import { ChatManagerService } from './chat-manager.service';
import { ChatModel, ChatRequestModel } from './chat-model';

/**
 * @internal
 */
@Injectable()
export class ChatInternalService extends Disposable {
  @Autowired(AIBackSerivcePath)
  public aiBackService: IAIBackService;

  @Autowired(PreferenceService)
  protected preferenceService: PreferenceService;

  @Autowired(IChatManagerService)
  private chatManagerService: ChatManagerService;

  private readonly _onChangeRequestId = new Emitter<string>();
  public readonly onChangeRequestId: Event<string> = this._onChangeRequestId.event;

  private _latestRequestId: string;
  public get latestRequestId(): string {
    return this._latestRequestId;
  }

  #sessionModel: ChatModel;
  get sessionModel() {
    return this.#sessionModel;
  }

  constructor() {
    super();
    this.#sessionModel = this.chatManagerService.startSession();
  }

  public setLatestRequestId(id: string): void {
    this._latestRequestId = id;
    this._onChangeRequestId.fire(id);
  }

  createRequest(input: string, agentId: string, command?: string) {
    return this.chatManagerService.createRequest(this.#sessionModel.sessionId, input, agentId, command);
  }

  sendRequest(request: ChatRequestModel, regenerate = false) {
    return this.chatManagerService.sendRequest(this.#sessionModel.sessionId, request, regenerate);
  }

  cancelRequest() {
    this.chatManagerService.cancelRequest(this.#sessionModel.sessionId);
  }

  clearSessionModel() {
    this.chatManagerService.clearSession(this.#sessionModel.sessionId);
    this.#sessionModel = this.chatManagerService.startSession();
  }

  override dispose(): void {
    this.#sessionModel?.dispose();
    super.dispose();
  }
}
