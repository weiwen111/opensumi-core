import { Injectable, Injector, Autowired } from '@ali/common-di';
import { IElectronMainLifeCycleService } from '@ali/ide-core-common/lib/electron';
import { IRPCProtocol } from '@ali/ide-connection';
import { IMainThreadLayout, IExtHostLayout } from '../../common/kaitian/layout';
import { IMainLayoutService, TabBarRegistrationEvent } from '@ali/ide-main-layout';
import { TabBarHandler } from '@ali/ide-main-layout/lib/browser/tabbar-handler';
import { ExtHostKaitianAPIIdentifier } from '../../common/kaitian';
import { IEventBus, Disposable } from '@ali/ide-core-browser';

@Injectable({ multiple: true })
export class MainThreaLayout extends Disposable implements IMainThreadLayout {
  @Autowired(IMainLayoutService)
  layoutService: IMainLayoutService;

  handlerMap = new Map<string, TabBarHandler>();

  proxy: IExtHostLayout;

  @Autowired(IEventBus)
  eventBus: IEventBus;

  constructor(private rpcProtocol: IRPCProtocol, private injector: Injector) {
    super();
    this.proxy = rpcProtocol.getProxy(ExtHostKaitianAPIIdentifier.ExtHostLayout);
  }

  $setSize(id: string, size: number): void {
    this.getHandler(id).setSize(size);
  }

  $activate(id: string): void {
    this.getHandler(id).activate();
  }

  $deactivate(id: string): void {
    this.getHandler(id).deactivate();
  }

  async $connectTabbar(id: string) {
    if (!this.handlerMap.has(id)) {
      const handle = this.layoutService.getTabbarHandler(id);
      if (handle) {
        this.bindHandleEvents(handle);
      } else {
        const disposer = this.eventBus.on(TabBarRegistrationEvent, (e) => {
          if (e.payload.tabBarId === id) {
            const handle = this.layoutService.getTabbarHandler(id);
            this.bindHandleEvents(handle!);
            disposer.dispose();
          }
        });
        this.addDispose(disposer);
      }
    }
  }

  private bindHandleEvents(handle: TabBarHandler) {
    this.handlerMap.set(handle.containerId, handle);
    handle.onActivate(() => {
      this.proxy.$acceptMessage(handle.containerId, 'activate');
    });
    handle.onInActivate(() => {
      this.proxy.$acceptMessage(handle.containerId, 'deactivate');
    });
  }

  protected getHandler(id: string) {
    const handler = this.layoutService.getTabbarHandler(id);
    if (!handler) {
      console.warn(`MainThreaLayout:没有找到${id}对应的handler`);
    }
    return handler!;
  }

}
