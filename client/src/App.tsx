import { Routes, Route } from 'react-router-dom';
import { I18nProvider } from './context/i18nContext';
import { SettingsProvider } from './context/settingsContext';
import { LocalGameProvider } from './game/local/LocalGameProvider';
import HomePage from './pages/HomePage';
import ModeSelectionPage from './pages/ModeSelectionPage';
import LocalSetupPage from './pages/LocalSetupPage';
import LocalGamePage from './pages/LocalGamePage';
import OnlineLobbyPage from './pages/OnlineLobbyPage';
import HowToPlayPage from './pages/HowToPlayPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import LeaderboardPage from './pages/LeaderboardPage';

export default function App() {
  return (
    <I18nProvider>
      <SettingsProvider>
        <LocalGameProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/mode" element={<ModeSelectionPage />} />
            <Route path="/play/local" element={<LocalSetupPage />} />
            <Route path="/game/local" element={<LocalGamePage />} />
            <Route path="/play/online" element={<OnlineLobbyPage />} />
            <Route path="/how-to-play" element={<HowToPlayPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </LocalGameProvider>
      </SettingsProvider>
    </I18nProvider>
  );
}
