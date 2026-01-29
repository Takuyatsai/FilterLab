/**
 * 版本歷史紀錄
 * 每次發布新版本時，請將新版本號加到此陣列的最後。
 */
export const VERSION_HISTORY = [
    '1.0.0',
    '1.0.1',
    '1.1.1'
];

/**
 * 當前應用程式版本
 * 自動取得 VERSION_HISTORY 中的最後一項
 */
export const APP_VERSION = VERSION_HISTORY[VERSION_HISTORY.length - 1];
