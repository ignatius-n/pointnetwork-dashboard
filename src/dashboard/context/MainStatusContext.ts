import {createContext, useEffect, useState, useCallback, useRef} from 'react';
import {
    DashboardChannelsEnum,
    FirefoxChannelsEnum,
    GenericChannelsEnum,
    NodeChannelsEnum,
    UninstallerChannelsEnum
} from '../../@types/ipc_channels';
import {IdentityLog, LaunchProcessLog} from '../../@types/generic';
import {BalanceCheckResult} from '../../@types/results';
import {MainStatus} from '../../@types/context';

const CHECK_BALANCE_INTERVAL_MS = 30_000;

export const useMainStatus = () => {
    // General
    const [identifier, setIdentifier] = useState<string>('');
    const [loader, setIsLaunching] = useState<{
        isLoading: boolean;
        message: string;
    }>({isLoading: true, message: 'Checking for updates...'});
    const [launchFailed, setLaunchFailed] = useState(false);
    // Node
    const [nodeVersion, setNodeVersion] = useState<string>('');
    const [isNodeRunning, setIsNodeRunning] = useState<boolean>(false);
    const [engineErrorCode, setEngineErrorCode] = useState<number>(0);
    // PointSDK
    const [sdkVersion, setSdkVersion] = useState<string>('');
    // Browser
    const [browserVersion, setBrowserVersion] = useState<string>('');
    const [isBrowserRunning, setIsBrowserRunning] = useState<boolean>(false);
    // Identity
    const [identityInfo, setIdentityInfo] = useState<{
        identity: string;
        address: string;
    }>({
        identity: '',
        address: ''
    });
    const [balance, setBalance] = useState<number | string>(0);
    const timeoutId = useRef<NodeJS.Timeout | undefined>();

    // Register these events once to prevent leaks
    const setListeners = () => {
        window.Dashboard.on(NodeChannelsEnum.error, (log: string) => {
            const parsed: LaunchProcessLog = JSON.parse(log);
            setIsNodeRunning(parsed.isRunning);
            setEngineErrorCode(Number(parsed.log));
            setIsLaunching({isLoading: false, message: ''});
        });

        window.Dashboard.on(NodeChannelsEnum.running_status, (log: string) => {
            const parsed: LaunchProcessLog = JSON.parse(log);
            setIsNodeRunning(parsed.isRunning);
            setLaunchFailed(parsed.launchFailed);
            if (parsed.relaunching) {
                setIsLaunching(prevState => ({
                    ...prevState,
                    message: 'Trying to connect to Point Engine'
                }));
            }
        });

        window.Dashboard.on(FirefoxChannelsEnum.running_status, (log: string) => {
            const parsed: LaunchProcessLog = JSON.parse(log);
            setIsBrowserRunning(parsed.isRunning);
        });

        window.Dashboard.on(UninstallerChannelsEnum.running_status, (log: string) => {
            const parsed: LaunchProcessLog = JSON.parse(log);
            setIsLaunching({isLoading: parsed.isRunning, message: parsed.log});
        });

        window.Dashboard.on(DashboardChannelsEnum.closing, () => {
            setIsLaunching({
                isLoading: true,
                message: 'Closing Point'
            });
        });

        window.Dashboard.on(DashboardChannelsEnum.log_out, () => {
            setIsLaunching({
                isLoading: true,
                message: 'Logging Out'
            });
        });

        window.Dashboard.on(GenericChannelsEnum.check_for_updates, (log: string) => {
            const parsed = JSON.parse(log);
            if (parsed.success) {
                setIsLaunching({
                    isLoading: true,
                    message: 'Starting Point Network'
                });
            } else {
                setIsLaunching({isLoading: false, message: ''});
            }
        });

        window.Dashboard.on(NodeChannelsEnum.get_identity, (log: string) => {
            const parsed: IdentityLog = JSON.parse(log);
            if (!parsed.isFetching) {
                setIdentityInfo({identity: parsed.identity, address: parsed.address});
            }
        });

        window.Dashboard.on(
            DashboardChannelsEnum.check_balance_and_airdrop,
            (result: BalanceCheckResult) => {
                if (result.success) {
                    setBalance(result.value);
                    checkBalance(CHECK_BALANCE_INTERVAL_MS);
                } else {
                    // There's been an error, keep the "old" balance and wait longer for the next check
                    checkBalance(CHECK_BALANCE_INTERVAL_MS * 3);
                }
            }
        );
    };

    const getInfo = async () => {
        const [id, pointNodeVersion, pointSdkVersion, firefoxVersion] = await Promise.all([
            window.Dashboard.getIndentifier(),
            window.Dashboard.getNodeVersion(),
            window.Dashboard.getSdkVersion(),
            window.Dashboard.getFirefoxVersion()
        ]);
        setIdentifier(id);
        setNodeVersion(pointNodeVersion);
        setSdkVersion(pointSdkVersion);
        setBrowserVersion(firefoxVersion);
    };

    const checkBalance = useCallback(delayMs => {
        clearTimeout(timeoutId.current);
        timeoutId.current = setTimeout(() => {
            window.Dashboard.checkBalance();
        }, delayMs);
    }, []);

    // 1. Set listeners and get info
    const init = async () => {
        setListeners();
        getInfo();
    };
    useEffect(() => {
        init();
    }, []);

    // 2. Once node is running, we launch the browser
    useEffect(() => {
        if (isNodeRunning) {
            window.Dashboard.launchBrowser();
            window.Dashboard.checkBalanceAndAirdrop();
            window.Dashboard.sendGeneratedEventToBounty();
            checkBalance(CHECK_BALANCE_INTERVAL_MS);
            setInterval(() => {
                window.Dashboard.getIdentityInfo();
            }, 10000);
        }
    }, [isNodeRunning]);

    // 3. Once browser is running, we finish the launch procedure
    useEffect(() => {
        if (isBrowserRunning) {
            setIsLaunching({
                isLoading: false,
                message: 'Launched'
            });
        }
    }, [isBrowserRunning]);

    return {
        isBrowserRunning,
        isNodeRunning,
        identifier,
        browserVersion,
        nodeVersion,
        sdkVersion,
        launchFailed,
        loader,
        identityInfo,
        balance,
        engineErrorCode,
        getInfo
    };
};

export const MainStatusContext = createContext<MainStatus>({} as unknown as MainStatus);
