export class DefaultRunner {
    start(callback) {
        this.callback = callback;
        this.update = this.update.bind(this);
        this.animationFrameId = window.requestAnimationFrame(this.update);
    }
    stop() {
        if (this.animationFrameId) {
            window.cancelAnimationFrame(this.animationFrameId);
        }
    }
    update(timestamp) {
        this.callback && this.callback(timestamp);
        this.animationFrameId = window.requestAnimationFrame(this.update);
    }
}
