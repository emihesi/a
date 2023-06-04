import React, { useState, useEffect } from "react";
import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnect from "@walletconnect/web3-provider";
import { useDispatch, useSelector } from "react-redux";
import { NotificationManager } from "react-notifications";
import { setConnectedChainId, setConnectedWalletAddress } from "../store/actions/auth.actions";
import { UPDATE_WEB3, SET_CONNECTED_WALLET_ADDRESS, SET_CONNECTED_CHAIN_ID } from "../actions/action.types";
import { ETHEREUM_CHAIN_ID } from "../env";

const providerOptions = {
  // Example with WalletConnect provider
  walletconnect: {
    display: {
      name: "Wallet Connect",
      description: "Scan qrcode with your mobile wallet"
    },
    package: WalletConnect,
    options: {
      infuraId: "9dd88b07c58d4af3998955cf0808a9e9" // required
    }
  }
};

const web3Modal = new Web3Modal({
  network: "mainnet",
  cachProvider: true,
  theme: "dark",
  providerOptions
});

const MainLayout = ({ children }) => {
  const globalAccount = useSelector((state) => state.auth.currentWallet);
  const globalWeb3 = useSelector((state) => state.auth.globalWeb3);
  const claimableAmount = useSelector((state) => state.auth.balance);
  const globalChainId = useSelector(state => state.auth.currentChainId);
  const dispatch = useDispatch();

  const [connected, setConnected] = useState(false);
  const [web3Provider, setWeb3Provider] = useState({});
  const [compressedAddress, setCompressedAddress] = useState("");

  const makeCompressedAccount = (accountStr) => {
    return (
      accountStr.substring(0, 6) +
      "..." +
      accountStr.substring(accountStr.length - 4, accountStr.length)
    );
  };

  const onClickConnectWallet = async () => {
    try {
      const provider = await web3Modal.connect();

      const web3 = new Web3(provider);
      setWeb3Provider(provider);
      dispatch({ type: UPDATE_WEB3, payload: web3 });
      const accounts = await web3.eth.getAccounts();
      const chainId = await web3.eth.getChainId();
      dispatch({ type: SET_CONNECTED_CHAIN_ID, payload: chainId });
      console.log("chainId = ", chainId);
      console.log("typeof chainId = ", typeof chainId);

      if (accounts[0]) {
        console.log("accounts[0] = ", accounts[0]);
        setCompressedAddress(makeCompressedAccount(accounts[0]));
        setConnected(true);
        dispatch({ type: SET_CONNECTED_WALLET_ADDRESS, payload: accounts[0] });

        if (globalChainId === ETHEREUM_CHAIN_ID) 
          NotificationManager.success("You've connected a wallet account. " + makeCompressedAccount(accounts[0]), "Success", 5000, () => {});
      } else {
        setCompressedAddress("");
        setConnected(false);
        dispatch({ type: SET_CONNECTED_CHAIN_ID, payload: undefined });
        dispatch({ type: SET_CONNECTED_WALLET_ADDRESS, payload: undefined });
      }
    } catch (error) {
      setCompressedAddress("");
      console.error(error);
      setConnected(false);
      dispatch({ type: SET_CONNECTED_CHAIN_ID, payload: undefined });
      dispatch({ type: SET_CONNECTED_WALLET_ADDRESS, payload: undefined });
    }
  };

  const onClickDisconnect = async () => {
    console.log(" onClickDisconnect() 00 ");
    try {
      await web3Modal.clearCachedProvider();
      setCompressedAddress("");
      dispatch({ type: SET_CONNECTED_CHAIN_ID, payload: undefined });
      dispatch({ type: SET_CONNECTED_WALLET_ADDRESS, payload: undefined });
    } catch (e) {
      console.log(" onClickDisconnect() exception : ", e);
    }
    setConnected(false);
  };

  useEffect(() => {
    if (web3Provider?.on) {
      const handleAccountsChanged = (accounts) => {
        if (accounts[0]) {
          dispatch({ type: SET_CONNECTED_WALLET_ADDRESS, payload: accounts[0] });
          setConnected(true);
        } else {
          dispatch({ type: SET_CONNECTED_WALLET_ADDRESS, payload: undefined });
          setConnected(false);
        }
      };

      const handleChainChanged = (chainId) => {
        dispatch({ type: SET_CONNECTED_CHAIN_ID, payload: chainId });
      };

      const handleDisconnect = () => {
        onClickDisconnect();
      };

      web3Provider.on("accountsChanged", handleAccountsChanged);
      web3Provider.on("chainChanged", handleChainChanged);
      web3Provider.on("disconnect", handleDisconnect);

      return () => {
        if (web3Provider.removeListener) {
          web3Provider.removeListener("accountsChanged", handleAccountsChanged);
          web3Provider.removeListener("chainChanged", handleChainChanged);
          web3Provider.removeListener("disconnect", handleDisconnect);
        }
      };
    }
  }, [web3Provider, dispatch]);

  useEffect(() => {
    if (globalAccount) {
      setCompressedAddress(makeCompressedAccount(globalAccount));
      setConnected(true);
    }
  }, [globalAccount]);

  return (
    <div id="main-layout">
      <div id="header" className="section">
        <div className="page-container">
          <img className="logo" src="/assets/imgs/logo.png" alt="logo" />

          <div className="btn">
            {
              connected === false ?   
              <div className="btn-text"
                style={{ userSelect: "none" }}
                onClick={() => onClickConnectWallet()}
              >Connect Wallet</div>
              :
              <div className="btn-text"
                style={{ userSelect: "none" }}
                onClick={() => onClickDisconnect()}
              >Disconnect</div>
            }
          </div>
        </div>
      </div>

      <div id="main-body">
        {children}
        <img className="bg" src="/assets/imgs/bg.png" alt="bg" />
        <img className="trees" src="/assets/imgs/bottom.png" alt="trees" />
      </div>
    </div>
  );
};

export default MainLayout;
