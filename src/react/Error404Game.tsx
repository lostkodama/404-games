import {useEffect, useRef} from 'react';
import {create404Game} from '../public';

export type Error404GameProps = {
    accentColor?: string;
};

export function Error404Game({accentColor}: Error404GameProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const controller = create404Game({
            container,
            ...(accentColor === undefined ? {} : {accentColor}),
        });
        return () => controller.destroy();
    }, [accentColor]);

    return <div ref={containerRef} />;
}
