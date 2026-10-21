import { FC } from 'react';

import styles from '../../../../static/scss/common.m.scss';

interface Props {
  functionLogo: ReactNode;
  functionText: string | undefined;
}
// if (size(get(confirmation, 'input')) > 0) {
//   functionLogo = contractType ? iconContract : iconMessage;
//   functionText = formatMessage({
//     id: `CONTRACTS.${contractType ? contractType : 'MessageSignature'}`,
//   });
// }
const TokenDescriptor: FC<Props> = ({ functionLogo, functionText }) => {
  return (
    <div className={styles.tokenDes}>
      {functionLogo && (
        <div className="logo">
          <img src={functionLogo} alt="" />
        </div>
      )}
      {functionText && <div className={styles.desText}>{functionText}</div>}
    </div>
  );
};

export default TokenDescriptor;
