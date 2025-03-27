export class DefaultRunner {
    start(callback) {
        this.callback = callback;
        this.animationFrameId = requestAnimationFrame(this.update);
    }
    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
    update(timestamp) {
        this.callback && this.callback(timestamp);
        this.animationFrameId = requestAnimationFrame(this.update);
    }
}
