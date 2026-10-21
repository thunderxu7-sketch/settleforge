import Toast from '../index';
import log from 'loglevel';

const Test = () => {
  return (
    <>
      <div title="Loading">
        <div
          onClick={() =>
            Toast.show({
              icon: 'loading',
              afterClose: () => {
                log.info('after');
              },
            })
          }
        >
          Click it to show Loading toast.
        </div>
      </div>

      <div title="Success">
        <div>
          <div
            onClick={() =>
              Toast.show({
                icon: 'success',
                content: 'Success!',
              })
            }
          >
            Click it to show Success toast.
          </div>
        </div>
      </div>

      <div title="Fail">
        <div>
          <div
            onClick={() => {
              Toast.show({
                icon: 'fail',
                content: 'Fail',
              });
            }}
          >
            Click it to show Fail toast.
          </div>
        </div>
      </div>

      <div title="Info">
        <div>
          <div
            onClick={() => {
              Toast.show({
                icon: 'info',
                content: 'Info',
                duration: 0, // When duration is passed 0, it will never disappear
              });
            }}
          >
            Click it to show Info toast.
          </div>
          <div
            onClick={() => {
              Toast.hide();
            }}
          >
            Close Toast.
          </div>
        </div>
      </div>
    </>
  );
};

export default Test;
