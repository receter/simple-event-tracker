import { useReducer, useState } from 'react';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as styles from './styles.module.css';

dayjs.extend(relativeTime);

function sortTrackersByLatestEvent(a, b) {
  const latestDateA = dayjs(a.events[a.events.length - 1]);
  const latestDateB = dayjs(b.events[b.events.length - 1]);
  if (latestDateA.isAfter(latestDateB)) {
    return -1;
  } else {
    return 1
  }
}

const initialState = {
  trackers: []
};

function initState(initialState) {
  const trackersJson = localStorage.getItem('trackers');
  if (trackersJson) {
    const trackers = JSON.parse(trackersJson).map(tracker => {
      // For backwards compatibility
      if (!tracker.id) {
        tracker.id = uuidv4();
      }
      return tracker;
    });
    return { ...initialState, trackers }
  }
  return initialState;
}

function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_TRACKER': {
      const updatedTrackers = [...state.trackers, { id: uuidv4(), name: action.name, events: [] }];
      localStorage.setItem('trackers', JSON.stringify(updatedTrackers));
      return { ...state, trackers: updatedTrackers }
    }
    case 'TRACK_EVENT': {
      const { id, time } = action;
      const updatedTrackers = state.trackers.map((tracker, index) => {
        if (tracker.id === id) {
          return { ...tracker, events: [...tracker.events, time] }
        } else {
          return tracker;
        }
      });
      localStorage.setItem('trackers', JSON.stringify(updatedTrackers));
      return { ...state, trackers: updatedTrackers };
    }
    case 'DELETE_TRACKER': {
      const { id } = action;
      const updatedTrackers = [...state.trackers];
      const indexOfTracker = updatedTrackers.findIndex(tracker => tracker.id === id);
      updatedTrackers.splice(indexOfTracker, 1);
      localStorage.setItem('trackers', JSON.stringify(updatedTrackers));
      return { ...state, trackers: updatedTrackers };
    }
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState, initState);
  const [createTrackerName, setCreateTrackerName] = useState('');
  const [newTrackerActive, setNewTrackerActive] = useState(false);
  const [trackEventActive, setTrackEventActive] = useState(false);
  const [trackEventTrackerId, setTrackEventTrackerId] = useState(null);
  const [trackEventTime, setTrackEventTime] = useState(null);
  const [trackerDetailView, setTrackerDetailView] = useState(null);

  function handleClickNewTracker() {
    setCreateTrackerName('');
    setNewTrackerActive(true);
  }

  function handleClickCreateTracker() {
    setNewTrackerActive(false);
    dispatch({ type: 'CREATE_TRACKER', name: createTrackerName });
  }

  function handleClickTrackEvent(trackerId) {
    setTrackEventTime(Date.now());
    setTrackEventTrackerId(trackerId);
    setTrackEventActive(true);
  }

  function handleClickSaveEvent() {
    dispatch({ type: 'TRACK_EVENT', id: trackEventTrackerId, time: trackEventTime });
    setTrackEventActive(false);
  }

  function handleClickDiscardEvent() {
    setTrackEventActive(false);
  }

  function handleClickCancelNewTracker() {
    setNewTrackerActive(false);
  }

  function handleClickTracker(trackerId) {
    setTrackerDetailView(state.trackers.find(tracker => tracker.id === trackerId));
  }

  function handleClickCloseDetailView() {
    setTrackerDetailView(null);
  }

  function handleClickDeleteTracker(trackerId) {
    if (window && window.confirm('Are you sure you want to delete this tracker?')) {
      setTrackerDetailView(null);
      dispatch({ type: 'DELETE_TRACKER', id: trackerId });
    }
  }

  const sortedTrackers = state.trackers.sort(sortTrackersByLatestEvent);

  if (trackerDetailView) {
    const tracker = trackerDetailView;
    const firstEvent = tracker.events[0];
    const lastEvent = tracker.events[tracker.events.length - 1];
    const dateNow = dayjs();
    const dateCreated = dayjs(firstEvent);
    const daysSinceCreated = Math.max(14, Math.ceil(dateNow.diff(dateCreated, 'days', true)));
    const calendarDays = [];
    for (let i = 0; i < daysSinceCreated; i++) {
      calendarDays.push(dateCreated.subtract(i, 'day'));
    }
    return <div className={styles.app}>
      <div className={styles.detailView}>
        <button className={styles.detailViewClose} onClick={handleClickCloseDetailView} type={'button'}>Close</button>
        <div className={styles.detailViewCount}>{tracker.events.length}</div>
        <h1 className={styles.detailViewTitle}>{tracker.name}</h1>
        <div className={styles.detailViewLast}>{dayjs(lastEvent).fromNow()}</div>
        <div className={styles.detailViewCalendar}>
          {calendarDays.map((day, index) => <div
            key={index}
            className={day.format('dd') === 'Su' ? styles.detailViewDay + ' ' + styles.detailViewSunday : styles.detailViewDay}
          >
            <div>{tracker.events.filter(event => dayjs(event).isSame(day, 'day')).length}</div>
            <div>{day.format('dd D.M')}</div>
          </div>)}
        </div>
        <button
          className={styles.detailViewDelete}
          onClick={() => handleClickDeleteTracker(tracker.id)}
          type={'button'}
        >
          Delete Tracker
        </button>
      </div>
    </div>
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        Simple Event Tracker
        <button className={styles.newTracker} type={'button'} onClick={handleClickNewTracker}>New Tracker</button>
      </header>
      <div
        className={styles.trackers}
      >
        {sortedTrackers.map(tracker => <div
          key={tracker.id}
          className={styles.tracker}
        >
          <div className={styles.trackerDetails} onClick={() => handleClickTracker(tracker.id)}>
            <div className={styles.trackerCount}>
              <div>{tracker.events.length}</div>
            </div>
            <div className={styles.trackerName}>
              <div>
                <div>{tracker.name}</div>
                <div className={styles.trackerInfo}>{dayjs(tracker.events[tracker.events.length - 1]).fromNow()}</div>
              </div>
            </div>
          </div>
          <button
            type={'button'}
            className={styles.trackerTrack}
            onClick={() => handleClickTrackEvent(tracker.id)}
          />
        </div>)}
      </div>
      {newTrackerActive && <div className={styles.createTracker}>
        <input type="text" autoFocus value={createTrackerName} onChange={e => setCreateTrackerName(e.target.value)} />
        <button onClick={handleClickCreateTracker}>Create</button>
        <button onClick={handleClickCancelNewTracker}>Cancel</button>
      </div>}
      {trackEventActive && <div className={styles.trackEvent}>
        <div className={styles.trackEventTitle}>
          1 &times; {state.trackers.find(tracker => tracker.id === trackEventTrackerId).name}
        </div>
        <div className={styles.trackEventTime}>
          {dayjs(trackEventTime).format('dd D.M HH:mm')}
          <div className={styles.timeManipulationButtons}>
            <button
              className={styles.subtractDayButton}
              type={'button'}
              onClick={() => setTrackEventTime(dayjs(trackEventTime).subtract(1, 'day').valueOf())}
            >- Day
            </button>
            <button
              className={styles.addDayButton}
              type={'button'}
              onClick={() => setTrackEventTime(dayjs(trackEventTime).add(1, 'day').valueOf())}
            >+ Day
            </button>
            <button
              className={styles.subtractHourButton}
              type={'button'}
              onClick={() => setTrackEventTime(dayjs(trackEventTime).subtract(1, 'hour').valueOf())}
            >- Hour
            </button>
            <button
              className={styles.addHourButton}
              type={'button'}
              onClick={() => setTrackEventTime(dayjs(trackEventTime).add(1, 'hour').valueOf())}
            >+ Hour
            </button>
          </div>
        </div>
        <button className={styles.trackEventSave} onClick={handleClickSaveEvent}>Save</button>
        <button className={styles.trackEventDiscard} onClick={handleClickDiscardEvent}>Discard</button>
      </div>}
    </div>
  );
}

export default App;
