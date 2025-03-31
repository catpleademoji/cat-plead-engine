export type Runner = {
    start(callback: (timestamp: DOMHighResTimeStamp) => void): void;
    stop(): void;
};
export class DefaultRunner implements Runner {
    animationFrameId: number | undefined;
    callback?: (timestamp: DOMHighResTimeStamp) => void;

    start(callback: (timestamp: DOMHighResTimeStamp) => void): void {
        this.callback = callback;
        this.update = this.update.bind(this);
        this.animationFrameId = window.requestAnimationFrame(this.update);
    }

    stop(): void {
        if (this.animationFrameId) {
            window.cancelAnimationFrame(this.animationFrameId);
        }
    }

    private update(timestamp: DOMHighResTimeStamp) {
        this.callback && this.callback(timestamp);
        this.animationFrameId = window.requestAnimationFrame(this.update);
    }
}
