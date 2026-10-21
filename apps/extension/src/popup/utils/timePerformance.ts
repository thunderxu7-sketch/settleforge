/**
 * This file is used to calculate the time taken for the execution of the function
 */

const log = console.log.bind(console, '=====TimePerformance=====');
interface Duration {
  startTime: number;
  endTime: number;
  spendTime?: number;
}

const timeObj: Record<string, Duration> = {};

class TimePerformance {
  static start(key: string) {
    if (!timeObj[key]) {
      timeObj[key] = {
        startTime: performance.now(),
        endTime: 0,
      };
      return;
    }
    timeObj[key].startTime = performance.now();
  }

  static end(key: string) {
    if (!timeObj[key]) {
      throw new Error('Invalid timeObj key');
      return;
    }
    timeObj[key].endTime = performance.now();
    timeObj[key].spendTime = timeObj[key].endTime - timeObj[key].startTime;
    log(`[key]: ${key}, spendTime: ${timeObj[key].spendTime?.toFixed()}ms`);
  }

  static list() {
    log('timeObj', timeObj);
  }
}

export default TimePerformance;
