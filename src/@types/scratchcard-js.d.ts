declare module "scratchcard-js" {
  export const SCRATCH_TYPE: {
    CIRCLE: string;
    LINE: string;
  };

  export interface ScratchCardOptions {
    scratchType: string;
    containerWidth: number;
    containerHeight: number;
    imageForwardSrc: string;
    htmlBackground: string;
    percentToFinish: number;
    brushSrc: string;
  }

  export class ScratchCard {
    constructor(selector: string, options: ScratchCardOptions);
    init(): void;
    getPercent(): number;
    canvas: HTMLCanvasElement;
  }
}
