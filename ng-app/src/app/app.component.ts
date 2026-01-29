import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { APP_VERSION } from './version';
import { ThemeService } from './theme.service';

interface ImageStats {
  meanL: number;
  contrast: number;
  avgSat: number;
  highlightMean: number;
  shadowMean: number;
  colorTemp: number;
  tint: number;
  width: number;
  height: number;
  imageData: ImageData;
}

interface IphoneParams {
  // 曝光
  exposure: number;
  // 增艷
  brilliance: number;
  // 亮部（原本的高光）
  highlights: number;
  // 陰影
  shadows: number;
  // 對比
  contrast: number;
  // 亮度
  brightness: number;
  // 黑點
  blackPoint: number;
  // 飽和度
  saturation: number;
  // 自然飽和度
  vibrance: number;
  // 色溫
  warmth: number;
  // 色調
  tint: number;
  // 清晰度
  clarity: number;
  // 畫質（銳利化）
  definition: number;
  // 降低雜點
  noiseReduction: number;
}

const MAX_SIZE = 3840;
// 全局強度係數：如果覺得效果太弱，可將此值調大 (例如 1.2)；太強則調小 (例如 0.8)
const STRENGTH_MULTIPLIER = 1.0;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  statusText = '';
  resultsText = '';

  readonly appVersion = APP_VERSION;

  canAnalyze = false;

  currentTheme: 'bright' | 'dark' = 'dark';

  constructor(public themeService: ThemeService) {
    this.currentTheme = this.themeService.getTheme();
  }

  exposure = 0;
  brilliance = 0;
  highlights = 0;
  shadows = 0;
  contrast = 0;
  brightness = 0;
  blackPoint = 0;
  saturation = 0;
  vibrance = 0;
  warmth = 0;
  tint = 0;
  clarity = 0;
  definition = 0;
  noiseReduction = 0;

  refImageUrl: string | null = null;
  meImageUrl: string | null = null;

  private refStats: ImageStats | null = null;
  private meStats: ImageStats | null = null;
  private meOriginalImageData: ImageData | null = null;
  private meFullImageData: ImageData | null = null;
  private meFullImage: HTMLImageElement | null = null;
  private lastSuggestedParams: IphoneParams | null = null;

  meOriginalWidth = 0;
  meOriginalHeight = 0;
  refOriginalWidth = 0;
  refOriginalHeight = 0;

  @ViewChild('refCanvas', { static: true })
  refCanvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('meCanvas', { static: true })
  meCanvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('previewCanvas', { static: true })
  previewCanvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    // nothing special, canvases are ready
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.currentTheme = this.themeService.getTheme();
  }

  onRefFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }
    this.setStatus('正在載入參考照片...');
    this.loadImageToCanvas(
      file,
      (url) => (this.refImageUrl = url),
      this.refCanvasRef.nativeElement
    )
      .then(({ stats, originalWidth, originalHeight }) => {
        this.refStats = stats;
        this.refOriginalWidth = originalWidth;
        this.refOriginalHeight = originalHeight;
        if (!stats) {
          this.setStatus('無法分析這張參考照片，請換一張試試。');
        } else {
          this.setStatus('參考照片已載入。');
        }
        this.updateCanAnalyze();
      })
      .catch((err) => {
        if (err !== 'HEIC_ERROR') {
          this.setStatus('載入參考照片時發生錯誤。');
        }
      });
  }

  onMeFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }
    this.setStatus('正在載入你的照片...');
    this.loadImageToCanvas(
      file,
      (url) => (this.meImageUrl = url),
      this.meCanvasRef.nativeElement
    )
      .then(({ stats, originalWidth, originalHeight, img }) => {
        this.meStats = stats;
        this.meOriginalWidth = originalWidth;
        this.meOriginalHeight = originalHeight;
        this.meFullImage = img;
        if (!stats) {
          this.setStatus('無法分析你的照片，請換一張試試。');
        } else if (stats) {
          this.setStatus('你的照片已載入。');
          const ctx = this.meCanvasRef.nativeElement.getContext('2d');
          if (ctx) {
            this.meOriginalImageData = ctx.getImageData(
              0,
              0,
              stats.width,
              stats.height
            );
          }

          // Also capture the FULL resolution ImageData for high-res export
          const fullCanvas = document.createElement('canvas');
          fullCanvas.width = originalWidth;
          fullCanvas.height = originalHeight;
          const fullCtx = fullCanvas.getContext('2d', {
            willReadFrequently: true,
          });
          if (fullCtx) {
            fullCtx.drawImage(img, 0, 0);
            this.meFullImageData = fullCtx.getImageData(
              0,
              0,
              originalWidth,
              originalHeight
            );
          }

          this.resetSliders();
          this.applyPreviewAdjustments();
        }
        this.updateCanAnalyze();
      })
      .catch((err) => {
        if (err !== 'HEIC_ERROR') {
          this.setStatus('載入你的照片時發生錯誤。');
        }
      });
  }

  analyze(): void {
    if (!this.refStats || !this.meStats) {
      return;
    }
    this.setStatus('正在分析差異...');
    const params = this.mapDiffToIphone(this.refStats, this.meStats);
    this.lastSuggestedParams = params;
    this.resultsText = this.formatResultText(params);
    this.setStatus('分析完成，可以依照建議到 iPhone 上調整。');

    this.exposure = params.exposure;
    this.brilliance = params.brilliance;
    this.highlights = params.highlights;
    this.shadows = params.shadows;
    this.contrast = params.contrast;
    this.brightness = params.brightness;
    this.blackPoint = params.blackPoint;
    this.saturation = params.saturation;
    this.vibrance = params.vibrance;
    this.warmth = params.warmth;
    this.tint = params.tint;
    this.clarity = params.clarity;
    this.definition = params.definition;
    this.noiseReduction = params.noiseReduction;

    this.applyPreviewAdjustments();
  }

  resetToSuggested(): void {
    if (!this.lastSuggestedParams) {
      return;
    }
    const params = this.lastSuggestedParams;
    this.exposure = params.exposure;
    this.brilliance = params.brilliance;
    this.highlights = params.highlights;
    this.shadows = params.shadows;
    this.contrast = params.contrast;
    this.brightness = params.brightness;
    this.blackPoint = params.blackPoint;
    this.saturation = params.saturation;
    this.vibrance = params.vibrance;
    this.warmth = params.warmth;
    this.tint = params.tint;
    this.clarity = params.clarity;
    this.definition = params.definition;
    this.noiseReduction = params.noiseReduction;
    this.applyPreviewAdjustments();
    this.setStatus('已將模擬調整重設回分析後的建議值。');
  }

  exportHighRes(): void {
    if (!this.meFullImageData || !this.meImageUrl) {
      this.setStatus('尚未載入原始解析度資料。');
      return;
    }
    this.setStatus('正在產生原始解析度照片，請稍候...');

    // We use a temporary canvas to process the full image
    const canvas = document.createElement('canvas');
    canvas.width = this.meOriginalWidth;
    canvas.height = this.meOriginalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a copy of the full image data to avoid modifying the original stored one
    const imageDataCopy = new ImageData(
      new Uint8ClampedArray(this.meFullImageData.data),
      this.meFullImageData.width,
      this.meFullImageData.height
    );

    // Apply adjustments to this full-res imageData
    this.processImageData(imageDataCopy);

    ctx.putImageData(imageDataCopy, 0, 0);

    // Trigger download
    const link = document.createElement('a');
    link.download = `filterlab-result-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();

    this.setStatus('原始解析度照片已匯出。');
  }

  copyResults(): void {
    if (!this.resultsText.trim()) {
      return;
    }
    navigator.clipboard
      .writeText(this.resultsText)
      .then(() => {
        this.setStatus('已複製建議內容到剪貼簿。');
        setTimeout(() => this.setStatus(''), 1500);
      })
      .catch(() => {
        this.setStatus('複製失敗，可能是瀏覽器權限問題。');
      });
  }

  onSliderChange(): void {
    this.applyPreviewAdjustments();
  }

  private setStatus(text: string): void {
    this.statusText = text;
  }

  private updateCanAnalyze(): void {
    this.canAnalyze = !!(this.refStats && this.meStats);
  }

  private resetSliders(): void {
    this.exposure = 0;
    this.brilliance = 0;
    this.highlights = 0;
    this.shadows = 0;
    this.contrast = 0;
    this.brightness = 0;
    this.blackPoint = 0;
    this.saturation = 0;
    this.vibrance = 0;
    this.warmth = 0;
    this.tint = 0;
    this.clarity = 0;
    this.definition = 0;
    this.noiseReduction = 0;
  }

  private loadImageToCanvas(
    file: File,
    setUrl: (url: string) => void,
    canvas: HTMLCanvasElement
  ): Promise<{
    stats: ImageStats | null;
    originalWidth: number;
    originalHeight: number;
    img: HTMLImageElement;
  }> {
    const fileName = file.name.toLowerCase();
    const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif');

    if (isHeic) {
      console.log('Detection: HEIC file identified.');
      const msg = '暫不支援電腦上傳 HEIC 格式。請將照片轉為 JPG 後再上傳。';
      this.setStatus(msg);
      return Promise.reject('HEIC_ERROR');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const originalWidth = img.width;
          const originalHeight = img.height;
          const { width, height } = this.resizeToFit(
            originalWidth,
            originalHeight,
            MAX_SIZE
          );
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('canvas context not available'));
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          setUrl(img.src);
          const stats = this.computeImageStats(canvas, ctx);
          resolve({ stats, originalWidth, originalHeight, img });
        };
        img.onerror = (e) => reject(e);
        img.src = reader.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  private resizeToFit(
    width: number,
    height: number,
    maxSize: number
  ): { width: number; height: number } {
    const ratio = Math.min(maxSize / width, maxSize / height, 1);
    return {
      width: Math.round(width * ratio),
      height: Math.round(height * ratio),
    };
  }

  private rgbToHsl(r: number, g: number, b: number): {
    h: number;
    s: number;
    l: number;
  } {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h, s, l };
  }

  private computeImageStats(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D
  ): ImageStats | null {
    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const len = data.length;

    let sumL = 0;
    let sumL2 = 0;
    let count = 0;

    let sumSat = 0;
    let highlightSum = 0;
    let highlightCount = 0;
    let shadowSum = 0;
    let shadowCount = 0;

    let sumR = 0;
    let sumG = 0;
    let sumB = 0;

    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a === 0) continue;

      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      sumL += l;
      sumL2 += l * l;
      count++;

      const { s } = this.rgbToHsl(r, g, b);
      sumSat += s;

      if (l > 200) {
        highlightSum += l;
        highlightCount++;
      } else if (l < 55) {
        shadowSum += l;
        shadowCount++;
      }

      sumR += r;
      sumG += g;
      sumB += b;
    }

    if (count === 0) {
      return null;
    }

    const meanL = sumL / count;
    const variance = sumL2 / count - meanL * meanL;
    const contrast = Math.sqrt(Math.max(variance, 0));

    const avgSat = sumSat / count;
    const highlightMean = highlightCount ? highlightSum / highlightCount : meanL;
    const shadowMean = shadowCount ? shadowSum / shadowCount : meanL;

    const avgR = sumR / count;
    const avgG = sumG / count;
    const avgB = sumB / count;
    const colorTemp = avgR - avgB;
    const tint = avgG - (avgR + avgB) / 2;

    return {
      meanL,
      contrast,
      avgSat,
      highlightMean,
      shadowMean,
      colorTemp,
      tint,
      width,
      height,
      imageData,
    };
  }

  private mapDiffToIphone(ref: ImageStats, me: ImageStats): IphoneParams {
    const diffL = ref.meanL - me.meanL;
    const diffContrast = ref.contrast - me.contrast;
    const diffSat = ref.avgSat - me.avgSat;
    const diffHighlight = ref.highlightMean - me.highlightMean;
    const diffShadow = ref.shadowMean - me.shadowMean;
    const diffTemp = ref.colorTemp - me.colorTemp;
    const diffTint = ref.tint - me.tint;

    // 曝光：以整體亮度差為主
    const exposureStops = diffL / 25;
    const exposureVal = this.clamp(Math.round(exposureStops * 24 * STRENGTH_MULTIPLIER), -100, 100);

    // 增艷：同時考慮亮度與對比的綜合，力度比曝光弱一些
    const brillianceBase = exposureStops * 10 + (diffContrast / 20) * 8;
    const brillianceVal = this.clamp(Math.round(brillianceBase * STRENGTH_MULTIPLIER), -100, 100);

    // 對比
    const contrastNorm = diffContrast / 20;
    const contrastVal = this.clamp(Math.round(contrastNorm * 25 * STRENGTH_MULTIPLIER), -100, 100);

    // 飽和度
    const satNorm = diffSat * 2.2;
    const saturationVal = this.clamp(Math.round(satNorm * 40 * STRENGTH_MULTIPLIER), -100, 100);

    // 自然飽和度：比飽和度溫和
    const vibranceVal = this.clamp(Math.round(satNorm * 25 * STRENGTH_MULTIPLIER), -100, 100);

    // 亮部
    const highlightNorm = diffHighlight / 35;
    const highlightsVal = this.clamp(Math.round(highlightNorm * -40 * STRENGTH_MULTIPLIER), -100, 100);

    // 陰影
    const shadowNorm = diffShadow / 35;
    const shadowsVal = this.clamp(Math.round(shadowNorm * -40 * STRENGTH_MULTIPLIER), -100, 100);

    // 亮度：比曝光再溫和一些的整體亮暗
    const brightnessVal = this.clamp(Math.round((diffL / 30) * 15 * STRENGTH_MULTIPLIER), -100, 100);

    // 黑點：主要根據暗部差異
    const blackPointVal = this.clamp(Math.round((diffShadow / -40) * 40 * STRENGTH_MULTIPLIER), -100, 100);

    const tempNorm = diffTemp / 40;
    const warmthVal = this.clamp(Math.round(tempNorm * 40 * STRENGTH_MULTIPLIER), -100, 100);

    const tintNorm = diffTint / 30;
    const tintVal = this.clamp(Math.round(tintNorm * 40 * STRENGTH_MULTIPLIER), -100, 100);

    // 清晰度／畫質：與對比與局部反差相關，這裡簡單用對比推估
    const clarityVal = this.clamp(Math.round(contrastNorm * 15 * STRENGTH_MULTIPLIER), -100, 100);
    const definitionVal = this.clamp(Math.round(contrastNorm * 15 * STRENGTH_MULTIPLIER), -100, 100);

    // 降低雜點：目前較難從全局統計直接估算，暫時預設為 0
    const noiseReductionVal = 0;

    return {
      exposure: exposureVal,
      brilliance: brillianceVal,
      highlights: highlightsVal,
      shadows: shadowsVal,
      contrast: contrastVal,
      brightness: brightnessVal,
      blackPoint: blackPointVal,
      saturation: saturationVal,
      vibrance: vibranceVal,
      warmth: warmthVal,
      tint: tintVal,
      clarity: clarityVal,
      definition: definitionVal,
      noiseReduction: noiseReductionVal,
    };
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.min(Math.max(v, min), max);
  }

  private formatResultText(params: IphoneParams): string {
    const lines: string[] = [];

    const add = (name: string, value: number, extra?: string) => {
      const dir =
        value > 0 ? `增加 ${value}` : value < 0 ? `減少 ${Math.abs(value)}` : '維持 0';
      const sign = value > 0 ? '+' : '';
      let line = `${name}：${dir}（iPhone 滑桿：約 ${sign}${value}）`;
      if (extra) {
        line += `\n  - ${extra}`;
      }
      lines.push(line);
    };

    // 完整對應 iPhone「照片」App 的調整名稱與順序
    add('曝光', params.exposure, '整體變亮／變暗，對整張照片影響最大。');
    add('增艷', params.brilliance, '提升畫面立體感與細節，同時拉高亮度與對比。');
    add('亮部', params.highlights, '負值通常代表回收亮部細節，避免天空或亮面過曝。');
    add('陰影', params.shadows, '正值會拉起暗部細節，負值會讓陰影更重、層次更強。');
    add('對比', params.contrast, '提升會讓明暗分離更明顯，降低會變柔和。');
    add('亮度', params.brightness, '在套用曝光後再微調，細修整體的明暗平衡。');
    add('黑點', params.blackPoint, '增加會讓黑色更深、更有力道，過多會吃掉暗部細節。');
    add('飽和度', params.saturation, '均勻地加強所有顏色，正值更繽紛、負值偏灰。');
    add(
      '自然飽和度',
      params.vibrance,
      '優先強化較不飽和的顏色，對膚色較溫和，適合細緻微調。'
    );
    add('色溫', params.warmth, '正值偏暖（黃橘），負值偏冷（藍）。');
    add('色調', params.tint, '正值偏洋紅，負值偏綠，可微調膚色與整體平衡。');
    add('清晰度', params.clarity, '提升中間細節反差，適合加強場景紋理，但過多會讓人像變硬。');
    add('畫質', params.definition, '偏向銳利化邊緣，適量即可，避免產生明顯白邊。');
    add('降低雜點', params.noiseReduction, '讓高 ISO 或暗部雜訊變得更平滑，過多會讓畫面偏糊。');

    return lines.join('\n');
  }

  private applyPreviewAdjustments(): void {
    if (!this.meStats || !this.meOriginalImageData) {
      return;
    }
    const width = this.meStats.width;
    const height = this.meStats.height;
    const canvas = this.previewCanvasRef.nativeElement;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const srcData = this.meOriginalImageData.data;
    const dstImageData = ctx.createImageData(width, height);
    const dstData = dstImageData.data;

    // Copy original data to dstData first
    for (let i = 0; i < srcData.length; i++) {
      dstData[i] = srcData[i];
    }

    this.processImageData(dstImageData);
    ctx.putImageData(dstImageData, 0, 0);
  }

  private processImageData(imageData: ImageData): void {
    const data = imageData.data;
    const exposure = this.exposure || 0;
    const brilliance = this.brilliance || 0;
    const highlights = this.highlights || 0;
    const shadows = this.shadows || 0;
    const contrast = this.contrast || 0;
    const brightness = this.brightness || 0;
    const blackPoint = this.blackPoint || 0;
    const saturation = this.saturation || 0;
    const vibrance = this.vibrance || 0;
    const warmth = this.warmth || 0;
    const tint = this.tint || 0;
    const clarity = this.clarity || 0;
    const definition = this.definition || 0;
    const noiseReduction = this.noiseReduction || 0;

    // 綜合成較接近 iPhone 調整邏輯的係數
    const expScale = (exposure + brilliance * 0.3 + brightness * 0.4) / 100;
    const contrastScale = (contrast + clarity * 0.5 + definition * 0.3) / 100;
    const satScale = saturation / 100;
    const vibranceScale = vibrance / 100;
    const warmthShift = warmth * 0.6;
    const tintShift = tint * 0.6;
    const blackPointScale = blackPoint / 100;
    const noiseScale = Math.max(0, noiseReduction) / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      const a = data[i + 3];

      let l = 0.299 * r + 0.587 * g + 0.114 * b;

      const expFactor = 1 + expScale;
      l = l * expFactor;

      const mid = 128;
      l = mid + (l - mid) * (1 + contrastScale);

      if (l > 180) {
        const hlScale = highlights / 100;
        l = l * (1 + 0.6 * hlScale);
      } else if (l < 75) {
        const shScale = shadows / 100;
        l = l * (1 + 0.8 * shScale);
      }

      // 黑點：強化或放鬆極暗區
      if (l < 60) {
        if (blackPointScale > 0) {
          l = l * (1 - 0.7 * blackPointScale);
        } else if (blackPointScale < 0) {
          l = l * (1 - 0.4 * blackPointScale); // 降低黑點時提亮暗部
        }
      }

      const { h, s } = this.rgbToHsl(r, g, b);
      // 飽和度 + 自然飽和度：對低飽和區域給予較多提升
      let newS = s * (1 + satScale) + vibranceScale * (1 - s); // s 越低，受到 vibrance 影響越大
      newS = Math.max(0, Math.min(1.4, newS));

      const c = (1 - Math.abs(2 * (l / 255) - 1)) * newS;
      const hh = h * 6;
      const x = c * (1 - Math.abs((hh % 2) - 1));
      let rr = 0;
      let gg = 0;
      let bb = 0;
      if (hh >= 0 && hh < 1) {
        rr = c;
        gg = x;
      } else if (hh >= 1 && hh < 2) {
        rr = x;
        gg = c;
      } else if (hh >= 2 && hh < 3) {
        gg = c;
        bb = x;
      } else if (hh >= 3 && hh < 4) {
        gg = x;
        bb = c;
      } else if (hh >= 4 && hh < 5) {
        rr = x;
        bb = c;
      } else if (hh >= 5 && hh < 6) {
        rr = c;
        bb = x;
      }
      // 降低雜點：在轉回 RGB 前，略微壓縮明暗差，降低噪點感
      if (noiseScale > 0) {
        const mid = 0.5;
        const lNorm = l / 255;
        const lSmoothed = mid + (lNorm - mid) * (1 - 0.4 * noiseScale);
        l = lSmoothed * 255;
      }

      const m = l / 255 - c / 2;
      r = (rr + m) * 255;
      g = (gg + m) * 255;
      b = (bb + m) * 255;

      r = r + warmthShift;
      b = b - warmthShift;

      // 色調（綠／洋紅）：偏洋紅時提升 G 與 R，偏綠時提升 G、壓低 R/B 一些
      r = r + tintShift * 0.4;
      g = g + tintShift;
      b = b - tintShift * 0.4;

      data[i] = this.clamp(Math.round(r), 0, 255);
      data[i + 1] = this.clamp(Math.round(g), 0, 255);
      data[i + 2] = this.clamp(Math.round(b), 0, 255);
      data[i + 3] = a;
    }
  }
}

