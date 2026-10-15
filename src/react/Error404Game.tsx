import {forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties} from 'react';
import {create404Game, type GameController} from '../public';

export type Error404GameHandle = {
    pause(): void;
    resume(): void;
    restart(): void;
};

export type Error404GameProps = {
    accentColor?: string;
    className?: string;
    style?: CSSProperties;
};

export const Error404Game = forwardRef<Error404GameHandle, Error404GameProps>(function Error404Game(
    {accentColor, className, style}, ref,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<GameController | null>(null);

    useImperativeHandle(ref, () => ({
        pause() { controllerRef.current?.pause(); },
        resume() { controllerRef.current?.resume(); },
        restart() { controllerRef.current?.restart(); },
    }), []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const controller = create404Game({
            container,
            ...(accentColor === undefined ? {} : {accentColor}),
        });
        controllerRef.current = controller;
        return () => {
            controllerRef.current = null;
            controller.destroy();
        };
    }, [accentColor]);

    return <div ref={containerRef} className={className} style={style} />;
});
