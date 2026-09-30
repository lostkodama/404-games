type GameLoopOptions = {
    maxDeltaTime: number;
    onFrame: (deltaTime: number) => void;
    onSuspend: () => void;
    onResume: () => void,
}

export function startGameLoop({maxDeltaTime, onFrame, onSuspend, onResume}: GameLoopOptions): () => void {

    let previousTime: number | undefined;
    let frameId: number | undefined;
    let isSuspended = false;
    let isStopped = false;

    function gameLoop(currentTime: number) {
        frameId = undefined

        if (isStopped || isSuspended) return

        if (previousTime === undefined) {
            previousTime = currentTime;
        }

        const rawDeltaTime = (currentTime - previousTime) / 1000;
        const deltaTime = Math.min(rawDeltaTime, maxDeltaTime);
        previousTime = currentTime;

        onFrame(deltaTime)

        if(!isStopped && !isSuspended) {
            frameId = requestAnimationFrame(gameLoop);
        }
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            isSuspended = true;

            if (frameId !== undefined) {
                cancelAnimationFrame(frameId);
                frameId = undefined;
            }

            onSuspend()
            return
        }

        isSuspended = false;
        previousTime = undefined;

        if (frameId === undefined) {
            frameId = requestAnimationFrame(gameLoop);
        }

        onResume()
    }

    document.addEventListener(
        'visibilitychange',
        handleVisibilityChange
    );

    frameId = requestAnimationFrame(gameLoop);

    return () => {
        isStopped = true

        if (frameId !== undefined) {
            cancelAnimationFrame(frameId);
            frameId = undefined;
        }

        document.removeEventListener(
            'visibilitychange',
            handleVisibilityChange
        );
    }
}