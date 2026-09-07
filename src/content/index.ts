namespace Gcuic {
  export async function bootstrap(): Promise<void> {
    const controller = new LayoutController();
    await controller.initialize();
  }
}

void Gcuic.bootstrap();
