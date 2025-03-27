export type Runner = {
    start(callback: (timestamp: DOMHighResTimeStamp) => void): void;
    stop(): void;
};
export declare class DefaultRunner implements Runner {
    animationFrameId: number | undefined;
    callback?: (timestamp: DOMHighResTimeStamp) => void;
    start(callback: (timestamp: DOMHighResTimeStamp) => void): void;
    stop(): void;
    private update;
}
