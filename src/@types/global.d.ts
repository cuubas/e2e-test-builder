
interface Window {
  currentTabId: number,
  $registerUiWindow: (window: Window) => void
}

declare class InputEvent extends KeyboardEvent {
  constructor(type: string, {
    data: any,
    inputType: string,
    bubbles: boolean
  });
}