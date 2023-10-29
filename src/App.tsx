import { Component, createResource, createSignal } from 'solid-js';
import Header from './layouts/Header/Header';
import './App.scss';
import Main from './layouts/Main/Main';
import { getBalance, userLatestRewards, getRanking } from './utils';
import detectEthereumProvider from '@metamask/detect-provider';
import ActionModal from './components/ActionModal/ActionModal';

export const METAMASK_ADDRESS_KEY = 'warpik_dashboard_metamask';
const [walletAddress, setWalletAddress] = createSignal(localStorage.getItem(METAMASK_ADDRESS_KEY) || null);
const [rankingType, setRankingType] = createSignal<'allTime' | 'season'>('allTime');
const [rsg, { mutate: mutateRsg }] = createResource(walletAddress, getBalance);
const [rewards, { mutate: mutateRewards }] = createResource(walletAddress, userLatestRewards);
const [ranking] = createResource(() => ({ rankingType: rankingType(), seasonName: 'warp' }), getRanking);
const [showModal, setShowModal] = createSignal(false);
const [modalText, setModalText] = createSignal('');
const handleModalOpen = (modalText: string) => {
  setModalText(modalText);
  setShowModal(true);
};
const handleCloseModal = () => setShowModal(false);
const timestamp = 1698768031;

const radios = [
  { name: 'All Time', value: 'allTime' },
  { name: 'Season', value: 'season' },
];

export const connect = async () => {
  const provider = await detectEthereumProvider();

  if (provider) {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }).catch((err) => {
      if (err.code === 4001) {
        handleModalOpen('Please connect to Metamask!');
      } else {
        console.error(err);
      }
    });
    setWalletAddress(accounts[0]);
    localStorage.setItem(METAMASK_ADDRESS_KEY, accounts[0]);
  } else {
    handleModalOpen('Please install MetaMask!');
  }
};

const disconnect = () => {
  setWalletAddress(null);
  localStorage.removeItem(METAMASK_ADDRESS_KEY);
  mutateRsg();
  mutateRewards();
};

window.ethereum.on('accountsChanged', handleAccountsChanged);

function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    console.log('Please connect to MetaMask.');
  } else if (accounts[0] !== walletAddress()) {
    setWalletAddress(accounts[0]);
    localStorage.setItem(METAMASK_ADDRESS_KEY, accounts[0]);
  }
}
const App: Component = () => {
  return (
    <>
      <ActionModal handleCloseModal={handleCloseModal} showModal={showModal()} modalText={modalText()} />
      <Header
        walletAddress={walletAddress}
        setWalletAddress={setWalletAddress}
        connect={connect}
        disconnect={disconnect}
        timestamp={timestamp}
      />
      <Main
        rewards={rewards()}
        rsg={rsg()?.balance}
        userRewardsLoading={rsg.loading}
        boosts={rsg()?.boosts}
        connect={connect}
        disconnect={disconnect}
        ranking={ranking()}
        loading={ranking.loading}
        radios={radios}
        setRadioValue={setRankingType}
        radioValue={rankingType}
        walletAddress={walletAddress()}
      />
    </>
  );
};

export default App;
