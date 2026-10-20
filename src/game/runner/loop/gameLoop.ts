type GameLoopOptions = {
    document: Document;
    maxDeltaTime: number;
    onFrame: (deltaTime: number) => void;
    onSuspend: () => void;
    onResume: () => void,
}

export type GameLoopController = {
    pause(): void;
    resume(): void;
    stop(): void;
}

export function startGameLoop({document, maxDeltaTime, onFrame, onSuspend, onResume}: GameLoopOptions): GameLoopController {
    const window = document.defaultView;
    if (!window) {
        throw new Error('Game loop document must belong to a browser window');
    }
    const requestFrame = window.requestAnimationFrame.bind(window);
    const cancelRequestedFrame = window.cancelAnimationFrame.bind(window);

    let previousTime: number | undefined;
    let frameId: number | undefined;
    let isSuspended = document.visibilityState === 'hidden'; // Browser / Env interruptions. Resume automatically.
    let isPaused = false; // Pause from user. Stay pause until resumed.
    let isStopped = false;

    function gameLoop(currentTime: number) {
        frameId = undefined

        if (isStopped || isSuspended || isPaused) return

        if (previousTime === undefined) {
            previousTime = currentTime;
        }

        const rawDeltaTime = (currentTime - previousTime) / 1000;
        const deltaTime = Math.min(rawDeltaTime, maxDeltaTime);
        previousTime = currentTime;

        onFrame(deltaTime)

        if (!isStopped && !isSuspended && !isPaused) {
            frameId = requestFrame(gameLoop);
        }
    }

    function cancelFrame() {
        if (frameId === undefined) {
            return;
        }

        cancelRequestedFrame(frameId);
        frameId = undefined;
    }

    function scheduleFrame() {
        if (
            isStopped ||
            isSuspended ||
            isPaused ||
            frameId !== undefined
        ) {
            return;
        }

        previousTime = undefined;
        frameId = requestFrame(gameLoop);
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            isSuspended = true;

            if (frameId !== undefined) {
                cancelRequestedFrame(frameId);
                frameId = undefined;
            }

            onSuspend()
            return
        }

        isSuspended = false;
        scheduleFrame()
        onResume()
    }

    document.addEventListener(
        'visibilitychange',
        handleVisibilityChange
    );

    scheduleFrame()

    return {
        pause() {
            if (isStopped || isPaused) {
                return;
            }

            isPaused = true;
            cancelFrame();
        },
        resume() {
            if (isStopped || !isPaused) {
                return;
            }

            isPaused = false;
            scheduleFrame();
        },
        stop() {
            if (isStopped) {
                return;
            }

            isStopped = true;
            cancelFrame();

            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
        }
    }
}
