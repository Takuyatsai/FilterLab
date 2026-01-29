# FilterLab 📸

[![Deploy to GitHub Pages](https://github.com/takuyatsai/FilterLab/actions/workflows/deploy.yml/badge.svg)](https://github.com/takuyatsai/FilterLab/actions/workflows/deploy.yml)
![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)

**FilterLab** 是一個專為 iPhone 攝影愛好者設計的濾鏡分析與模擬工具。它可以分析參考照片的影調，並提供接近 iPhone 「照片」App 的調整參數建議。

🔗 **線上使用**：[https://takuyatsai.github.io/FilterLab/](https://takuyatsai.github.io/FilterLab/)

---

## 🚀 版本說明 (Changelog)

### v1.1.1 (2026-01-29)
-   **🖼 高解析度預覽優化**：顯著提升網頁端預覽畫質，支援 4K 解析度 (3840px) 渲染，並引入高品質影像平滑演算法。
-   **🎨 色調匹配演算法升級**：擴大參數調整範圍至 +/-100 (對齊 iPhone 原生限制)，並優化曝光、增艷與對比度的轉換權重。
-   **🐛 模擬邏輯修正**：修復「亮部 (Highlights)」與「清晰度」的計算邏輯，解決高光處過曝與細節丟失問題。
-   **🔧 全域強度控制**：新增演算法強度係數 (Strength Multiplier)，便於開發階段快速微調整體效果。

### v1.1.0 (2026-01-16)
-   **🧪 自動化測試整合**：引入 **Playwright** 端到端測試框架，涵蓋主題切換、UI 狀態驗證與核心分析邏輯。
-   **🤖 CI/CD 流程升級**：在 GitHub Actions 流水線中整合「自動化測試」階段。現在每次部署前都會自動執行測試，確保發布版本之穩定性。
-   **🏷 版本管理優化**：重構版本控制機制，新增版本歷史紀錄功能，並實現 APP 版本號自動選取邏輯。

### v1.0.1 (2026-01-15)
-   **✨ 上傳防呆優化**：新增 HEIC/HEIF 格式偵測與引導，自動攔截不支援的格式並提供 iPhone 轉檔建議，提升使用者體驗。
-   **🛠 穩定性修復**：優化圖片載入錯誤攔截機制，確保錯誤訊息顯示精確不覆蓋。
-   **📦 專案瘦身**：移除實驗性的解碼庫，優化專案體積與執行效能。

### v1.0.0 (2026-01-15)
-   **核心功能發佈**：支援「參考照片」與「原始照片」的色調差異分析。
-   **解析度優化**：新增原始解析度偵測與顯示，並支援「原始解析度照片匯出」功能。
-   **模擬渲染**：實作即時 Canvas 預覽渲染，包含曝光、亮部、陰影等 14 項 iPhone 原生參數模擬。
-   **自動化部署**：整合 GitHub Actions CI/CD 流水線，實現 Push 後自動部署。

---

## ✨ 關鍵功能
1.  **影調分析**：自動計算兩張照片之間的曝光、對比與色彩差異。
2.  **iPhone 參數轉換**：將影像處理邏輯轉換為直觀的 iPhone 滑桿數值。
3.  **高畫質匯出**：網頁端進行低負載預覽，匯出時則使用全解析度像素運算。
4.  **隱私保護**：所有影像處理均在瀏覽器本機端執行，圖片不會上傳至伺服器。

## 🛠 技術棧
-   **Framework**: Angular 17
-   **Graphics**: HTML5 Canvas API (Pixel manipulation)
-   **Style**: Vanilla CSS (Modern aesthetic)
-   **Testing**: Playwright (E2E Testing)
-   **CI/CD**: GitHub Actions

---
© 2026 Takuya Tsai. Licensed under the MIT License.