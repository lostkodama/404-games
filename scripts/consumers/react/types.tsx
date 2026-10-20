import {createRef} from 'react';
import {Error404Game, type Error404GameProps, type Error404GameHandle} from '404-games/react';

const props: Error404GameProps = {accentColor: '#123456', className: 'game', style: {width: '100%'}};
const ref = createRef<Error404GameHandle>();
export const example = <Error404Game {...props} ref={ref} />;
ref.current?.pause();
ref.current?.resume();
ref.current?.restart();
