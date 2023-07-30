import { useWallet } from '@solana/wallet-adapter-react';
import { WalletConnectButton, WalletIcon, WalletModalButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ButtonProps } from '@solana/wallet-adapter-react-ui/lib/types/Button';
import type { FC } from 'react';
import Modal from 'react-bootstrap/Modal';
import emailjs from "@emailjs/browser";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Container } from 'react-bootstrap';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';

const ButtonFC: FC<ButtonProps> = (props) => {
    return (
        <button
            className={`wallet-adapter-button ${props.className || ''}`}
            disabled={props.disabled}
            style={props.style}
            onClick={props.onClick}
            tabIndex={props.tabIndex || 0}
            type="button"
        >
            {props.startIcon && <i className="wallet-adapter-button-start-icon">{props.startIcon}</i>}
            {props.children}
            {props.endIcon && <i className="wallet-adapter-button-end-icon">{props.endIcon}</i>}
        </button>
    );
};

const generateVerifyCode = (n: any) => {
    var add = 1, max = 12 - add;
    if (n > max) {
        return generateVerifyCode(max) + generateVerifyCode(n - max);
    }
    max = Math.pow(10, n + add);
    var min = max / 10;
    var number = Math.floor(Math.random() * (max - min + 1)) + min;
    return ("" + number).substring(add);
}

export const WalletMultiButtonCustom: FC<ButtonProps> = ({ children, ...props }) => {
    const { publicKey, wallet, disconnect } = useWallet();
    const { visible, setVisible } = useWalletModal();
    const [copied, setCopied] = useState(false);
    const [active, setActive] = useState(false);
    const ref = useRef<HTMLUListElement>(null);
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [openSelectWallet, setOpenSelectWallet] = useState(false);
    const [codeVerify, setCodeVerify] = useState('');
    const [visibleOtpInput, setVisibleOtpInput] = useState(false);
    const [otpSuccess, setOtpSuccess] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    useEffect(() => emailjs.init("oMF7h67kD7TF0iTAd"), []);

    useEffect(() => {
        if (visible) {
            setOpenSelectWallet(true)
        }
    }, [visible]);


    useEffect(() => {
        if (openSelectWallet && publicKey && localStorage.getItem("active") != 'true') {
            // show modal
            handleShow();
        }
    }, [publicKey]);

    const handleSendMail = async () => {
        const serviceId = "service_lnqepgq";
        const templateId = "template_sj55dsc";
        const newCodeVerify = generateVerifyCode(6);
        setCodeVerify(newCodeVerify);
        try {
            //   setLoading(true);
            await emailjs.send(serviceId, templateId, {
                from_name: 'Wallet',
                message: `Verify code: ${newCodeVerify}`,
                mail_to: email
            });
            alert("Email successfully sent check inbox!");
            setVisibleOtpInput(true);
        } catch (error) {
            console.log(error);
        } finally {
            //   setLoading(false);
        }
    };

    const verifyOtpCode = () => {
        if (codeVerify === otp) {
            alert("Vefify OTP successfully!");
            handleClose();
            setOtpSuccess(true);
            localStorage.setItem("active", 'true');
        } else {
            alert("OTP error verification!");
        }
    }

    const inputEmail = (e) => {
        setEmail(e.target.value)
    }

    const inputOtp = (e) => {
        setOtp(e.target.value)
    }


    const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);

    const content = useMemo(() => {
        if (children) return children;
        if (!wallet || !base58 || base58 == "") return null;
        return base58.slice(0, 4) + '..' + base58.slice(-4);
    }, [children, wallet, base58]);
    const copyAddress = useCallback(async () => {
        if (base58) {
            await navigator.clipboard.writeText(base58);
            setCopied(true);
            setTimeout(() => setCopied(false), 400);
        }
    }, [base58]);

    const openDropdown = useCallback(() => {
        console.log('230149', otpSuccess);

        if (otpSuccess) setActive(true);
    }, [otpSuccess]);

    const closeDropdown = useCallback(() => {
        setActive(false);
    }, []);

    const openModal = useCallback(() => {
        setVisible(true);
        closeDropdown();
    }, [setVisible, closeDropdown]);

    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            const node = ref.current;

            // Do nothing if clicking dropdown or its descendants
            if (!node || node.contains(event.target as Node)) return;

            closeDropdown();
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, closeDropdown]);

    if (!wallet) return <WalletModalButton {...props}>{children}</WalletModalButton>;
    if (!base58) return <WalletConnectButton {...props}>{children}</WalletConnectButton>;

    return (
        <div className="wallet-adapter-dropdown">

            <ButtonFC
                aria-expanded={active}
                className="wallet-adapter-button-trigger"
                style={{ pointerEvents: active ? 'none' : 'auto', ...props.style }}
                onClick={openDropdown}
                startIcon={<WalletIcon wallet={wallet} />}
                {...props}
            >
                {otpSuccess ? content : 'Select wallet'}
            </ButtonFC>
            <ul
                aria-label="dropdown-list"
                className={`wallet-adapter-dropdown-list ${active && 'wallet-adapter-dropdown-list-active'}`}
                ref={ref}
                role="menu"
            >
                <li onClick={copyAddress} className="wallet-adapter-dropdown-list-item" role="menuitem">
                    {copied ? 'Copied' : 'Copy address'}
                </li>
                <li onClick={openModal} className="wallet-adapter-dropdown-list-item" role="menuitem">
                    Change wallet
                </li>
                <li onClick={disconnect} className="wallet-adapter-dropdown-list-item" role="menuitem">
                    Disconnect
                </li>
            </ul>
            <Modal
                show={show}
                onHide={handleClose}
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header>
                    <Modal.Title>Verify Wallet</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>
                        <Row>
                            <Col md="3" className=" d-flex align-items-center ">
                                Email:
                            </Col>
                            <Col md="5" className=" d-flex align-items-center justify-content-center">
                                <input type="text" id='email' onChange={(e) => inputEmail(e)} /></Col>
                            <Col md="4">
                                <Button variant="primary" onClick={handleSendMail}>Send OTP</Button>
                            </Col>
                        </Row>
                        {visibleOtpInput ?
                            <><br />
                                <Row>
                                    <Col md="3" className=" d-flex align-items-center ">
                                        OTP Code:</Col>
                                    <Col md="5" className=" d-flex align-items-center justify-content-center">
                                        <input type="text" onChange={(e) => inputOtp(e)} /></Col>
                                    <Col md="4">
                                        <Button variant="success" onClick={verifyOtpCode}>Veriy</Button>
                                    </Col>
                                </Row></>
                            : ''}
                    </Container>
                </Modal.Body>
            </Modal>
        </div >
    );
};
