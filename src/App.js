import { useReducer, useState } from 'react';
import logo from './logo.svg';
import * as styles from './styles.module.css';

const initialState = {
  trackers: []
};

function initState(initialState) {
  const trackersJson = localStorage.getItem('trackers');
  if (trackersJson) {
    const trackers = JSON.parse(trackersJson);
    return { ...initialState, trackers }
  }
  return initialState;
}

function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_TRACKER': {
      const updatedTrackers = [...state.trackers, { name: action.name, events: [] }];
      localStorage.setItem('trackers', JSON.stringify(updatedTrackers));
      return { ...state, trackers: updatedTrackers }
    }
    case 'TRACK_EVENT': {
      const { id } = action;
      const updatedTrackers = state.trackers.map((tracker, index) => {
        if (index === id) {
          return { ...tracker, events: [...tracker.events, Date.now()] }
        } else {
          return tracker;
        }
      });
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

  function handleClickNewTracker() {
    setCreateTrackerName('');
    setNewTrackerActive(true);
  }

  function handleClickCreateTracker() {
    setNewTrackerActive(false);
    dispatch({ type: 'CREATE_TRACKER', name: createTrackerName });
  }

  function handleClickTrackEvent(trackerId) {
    setTrackEventTrackerId(trackerId);
    setTrackEventActive(true);
  }

  function handleClickSaveEvent() {
    dispatch({ type: 'TRACK_EVENT', id: trackEventTrackerId });
    setTrackEventActive(false);
  }

  function handleClickDiscardEvent() {
    setTrackEventActive(false);
  }

  function handleClickCancelNewTracker() {
    setNewTrackerActive(false);
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
        {state.trackers.map((tracker, index) => <div
          key={index}
          className={styles.tracker}
        >
          <div className={styles.trackerCount}>{tracker.events.length}</div>
          <div className={styles.trackerName}>{tracker.name}</div>
          <button
            className={styles.trackerTrack}
            type={'button'}
            onClick={() => handleClickTrackEvent(index)}
          >Track
          </button>
        </div>)}
      </div>
      {newTrackerActive && <div className={styles.createTracker}>
        <input type="text" autoFocus value={createTrackerName} onChange={e => setCreateTrackerName(e.target.value)} />
        <button onClick={handleClickCreateTracker}>Create</button>
        <button onClick={handleClickCancelNewTracker}>Cancel</button>
      </div>}
      {trackEventActive && <div className={styles.trackEvent}>
        <div className={styles.trackEventTitle}>
          1 x {state.trackers[trackEventTrackerId].name}
        </div>
        <button className={styles.trackEventSave} onClick={handleClickSaveEvent}>Save</button>
        <button className={styles.trackEventDiscard} onClick={handleClickDiscardEvent}>Discard</button>
      </div>}
    </div>
  );
}

export default App;
