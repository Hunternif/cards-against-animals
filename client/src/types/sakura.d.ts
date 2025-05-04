interface SakuraColorSettings {
  gradientColorStart: string;
  gradientColorEnd: string;
  gradientColorDegree: number;
}

type SakuraSettings = {
  className?: string;
  fallSpeed?: number;
  maxSize?: number;
  minSize?: number;
  delay?: number;
  colors?: SakuraColorSettings[];
};

declare module '@micman/sakura' {
  export default class Sakura {
    constructor(selector: string, settings?: SakuraSettings);
    start(): void;
    stop(graceful?: boolean): void;
  }
}
