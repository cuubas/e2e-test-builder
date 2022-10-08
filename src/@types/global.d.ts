declare global {

  interface Window {
    currentTabId: number,
    $registerUiWindow: (window: Window) => void
  }

}

export {};

// declare class InputEvent extends KeyboardEvent {
//   constructor(type: string, {
//     data: any,
//     inputType: string,
//     bubbles: boolean
//   });
// }
