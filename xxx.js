import gameLogic from "../controller/gameLogic";
import playerPrefs from "../utils/playerPrefs";
import tool from "../utils/tool";
import firebasesdk from "./firebasesdk";

const { ccclass, property } = cc._decorator;

@ccclass
export default class FbSdk extends cc.Component {
    private localeURL = 'https://www.cloudflare.com/cdn-cgi/trace23';
    public static instance: FbSdk;
    private preloadInterstitialAd = null;
    private preloadFirstInterstitialAd = null;
    private preloadRewardedVideo = null;
    private AD_WAS_NOT_LOAD: string = "was not load";
    private AD_NOT_COMPLETED: string = "not completed";
    public fbName: string = "Unknown";
    public fbId: string = "000000";
    public fbAvatar: string = "";
    public fbLocation: string = "us";
    public fbLanguage:string = "en"
    //public userLanguage: string = "en";
    public fbPlatform: string = "";
    private base64: string = "";
    private base64screen: string = "";
    public entryPointData;
    public country: string = "";
    //
    @property
    public reward_id: string = "";
    @property
    public interstitial_ads_id: string = ""
    @property
    public first_interstitial_ads_id: string = ""
    @property
    public banner_id: string = "";
    private FBInstant;
    //first time check

    onLoad() {

        this.fbName = 'Unknown' + Math.floor(Math.random() * 1000);
        cc.game.addPersistRootNode(this.node);
        this.FBInstant = (typeof FBInstant !== 'undefined') ? FBInstant : null;
        FbSdk.instance = this;
        //
        if (this.FBInstant != null) {
            console.log('Start game', 'fb...........');
            //test  here!
            const entryPointData = this.FBInstant.getEntryPointData();
            if (entryPointData) {
                console.log('Entry', entryPointData.deepLinkTo);
                if (entryPointData.deepLinkTo) {
                    firebasesdk.instance.LogEvent(entryPointData.deepLinkTo)
                }
            }
            //clear data
            //
            //
            this.GetDataUser(["locale"], (data) => {
                if (JSON.stringify(data).length > 2 && data.locale && data.locale.length > 0 &&data.language) {
                    //set location and lang
                    this.fbLocation = data.locale;
                    this.fbLanguage = data.language;
                    //
                    this.verifyLocal();
                    console.log('get data user locale', data.locale);
                    //exception
                }
                else {
                    //load manual
                    this.getLocaleManual((data) => {
                        let startIndex = data.search('loc');
                        let loc = data.substring(startIndex + 4, startIndex + 6).toLowerCase();
                        //convert from location to language
                        var countryCode = loc;
                        var lang = 'en';
                        if (countryCode == null || countryCode == undefined || countryCode.length == 0|| countryCode=='undefined') {
                            countryCode = 'us';
                        }
                        if(countryCode=='vn'){
                            lang = 'vi'
                        }
                        this.SetDataUser({ locale: countryCode,language: lang})
                    })

                }
            });

            //
            this.PreloadInterstitial();
            this.preloadRewardAd();

            const isFirstTime = playerPrefs.getBool(playerPrefs.FIRST_TIME_STR, true);
            console.log('First time: ad', isFirstTime);
            if (!isFirstTime) {
                this.PreloadFirstAd();
            }
            this.login();
        }else{
            this.getLocaleManual((data)=>{
                let startIndex = data.search('loc');
                let loc = data.substring(startIndex + 4, startIndex + 6).toLowerCase();
                //convert from location to language
                var countryCode = loc;
                var lang = 'en';
                if (countryCode == null || countryCode == undefined || countryCode.length == 0|| countryCode=='undefined') {
                    countryCode = 'us';
                }
                if(countryCode=='vn'){
                    lang = 'vi'
                }
                this.SetDataUser({ locale: countryCode,language: lang})
            })
        }

    

        //

    }
    private verifyLocal(){
        if(this.fbLocation==null|| this.fbLocation==undefined||this.fbLocation==''||this.fbLocation=='undefined'){
            this.fbLocation='us';
        }
    }
    /*     private GetLocale() {
            if (this.FBInstant == null) return 'en';
            if (this.fbLocale != ""){
                return this.fbLocale;
            }else{
                if(this.FBInstant.getLocale()!=null&&this.FBInstant.getLocale().length>0){
                    let locale:string =  this.FBInstant.getLocale().toLocaleLowerCase().substring(0,2) //vi_VN -> vi
                    console.log('My loc2',locale);
                    return locale;
                }else{
                    return null;
                }
    
     
            }
      
        } */
    public ResetDataAsyn() {
        this.getLocaleManual((data) => {
            let startIndex = data.search('loc');
            let loc = data.substring(startIndex + 4, startIndex + 6).toLowerCase();
            //convert from location to language
            var countryCode = loc;
            var lang = 'en';
            if (countryCode == null || countryCode == undefined || countryCode.length == 0|| countryCode=='undefined') {
                countryCode = 'us';
            }
            if(countryCode=='vn'){
                lang = 'vi'
            }
            this.SetDataUser({ locale: countryCode,language: lang})
        })
        //
    }
    public SetDataUser(data) {
if (data.locale) {
            console.log('Set New Locale:' + data.locale);
            this.fbLocation = data.locale.toLowerCase();
        }
        if(data.language){
            this.fbLanguage = data.language.toLowerCase();
        }

        if (this.FBInstant == null) return;
        this.FBInstant.player
            .setDataAsync(data)
            .then(() => {
                console.log('data is set');
            });
    }
    //
    public GetDataUser(parameter, callback) {
        if (this.FBInstant == null) return;
        this.FBInstant.player
            .getDataAsync(parameter)
            .then((data) => {
                callback(data);
            });
    }
    //
    public login() {
        if (this.FBInstant != null) {
            var contextID = this.FBInstant.context.getID();
            this.fbAvatar = this.FBInstant.player.getPhoto();
            this.fbName = this.FBInstant.player.getName().toString();
            this.fbId = this.FBInstant.player.getID().toString();
        }

    }
    private getLocaleManual(callback) {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                callback(xhr.response);
            }
        }
        xhr.open('GET', this.localeURL, true);
        xhr.send('');
    }
    public checkCanSubscribeBot(callback) {
        if (this.FBInstant == null) {
            callback(false);
            return;
        }
        //
        console.log('Check can subscribe');
        //this.sendLocaleSessionData();
        this.FBInstant.player.canSubscribeBotAsync().then((can_subscribe) => {
            if (can_subscribe) {
                console.log('Bot', 'can subscribe');
                callback(true);
            } else {
                console.log('Bot', 'can not subscribe');
                callback(false);
            }
        }).catch((e) => {
            console.log('Bot', 'Error can not subscribe');
            callback(false);
        });
        //
    }
    //banner
    isShowBanner: boolean = false;
    public showBannerAd() {

        if (this.isShowBanner) return;
        console.log('Show banner ads here');
        if (this.FBInstant) {

            this.FBInstant.loadBannerAdAsync(
                this.banner_id
            ).then(() => {
                this.isShowBanner = true;
                console.log('success');
            });
        }


    }
    //subscribe bot
    public SubscribeBot(callback: CallableFunction) {
        console.log('Subscribe bot...');
        if (this.FBInstant == null) return;
        let self = this;
        //this.sendLocaleSessionData();
        this.FBInstant.player.canSubscribeBotAsync().then((can_subscribe) => {
            if (can_subscribe) {
                this.FBInstant.player.subscribeBotAsync().then(() => {
                    if (callback) {
                        callback(true);
                    }
                }).catch((e) => {
if (callback) {
                        callback(false);
                    }
                    // Handle subscription failure
                });
            }
        });
    }
    //==========================ADS //========================== ///
    public GetInterstitialAds() {
        return this.preloadInterstitialAd;
    }
    public tracking(trackingName: string, value) {
        if (this.FBInstant != null) {
            try {
                var logged = this.FBInstant.logEvent(trackingName, 4, { level: value });
            } catch (error) {

            }
        }

    }


    // private
    public preloadRewardAd() {
        console.log('Preload reward ads');
        if (this.FBInstant == null) {
            return;
        }
        if (this.preloadRewardedVideo != null) {
            return;
        }
        let self = this;
        this.FBInstant.getRewardedVideoAsync(
            self.reward_id
        ).then(function (rewarded) {
            // Load the Ad asynchronously
            self.preloadRewardedVideo = rewarded;
            return self.preloadRewardedVideo.loadAsync();
        }).then(function () {
            console.log('Rewarded video preloaded');
        }).catch(function (err) {
            console.error('Rewarded video failed to preload: ' + err.message);
        });
    }
    public showRewardAd(callback = null) {
        console.log('Show item ad');
        //
        //
        //
        const rewardAd = () => {
            //video ad reward
            if (this.preloadRewardedVideo == null) {
                callback(false, 'Ad is not ready');
                return;
            }
            this.preloadRewardedVideo.showAsync()
                .then(function () {
                    // Perform post-ad success operation
                    console.log('Rewarded video watched successfully');
                    //
                    if (callback != null)
                        callback(true);
                    self.preloadRewardedVideo = null;
                    self.preloadRewardAd();
                }).catch(function (e) {
                    self.preloadRewardedVideo = null;
                    self.preloadRewardAd();
                    let message: string = e.message;
                    if (callback != null) {
                        if (message.includes(self.AD_NOT_COMPLETED)) {
                            //default reward
                            //callback(false, 'Please watch the AD to the end (30s) to get Rewards');
                            callback(true);
                        } else {
                            callback(false, 'Ad is not ready');
                        }

                    }


                });
        }
        var self = this;
        if (this.FBInstant == null) {
            if (callback != null)
                callback(true);
            return;
        }
        if (this.preloadRewardedVideo == null && this.preloadInterstitialAd == null) {
console.log('Reward ads + inter', 'null');
            if (callback != null)
                callback(false, 'Ad is not ready');
            return;
        } else {
            //case 1 interstitial ad

            if (this.preloadInterstitialAd != null) {
                console.log('inter', 'ad x');
                this.preloadInterstitialAd.showAsync()
                    .then(() => {
                        if (callback != null) {
                            self.preloadInterstitialAd = null
                            self.PreloadInterstitial();
                            callback(true);
                        }

                    })
                    .catch((e) => {
                        console.log('reward', 'sub x');
                        rewardAd();
                    });
            } else {
                console.log('reward', 'sub yyy');
                rewardAd();
            }


        }
    }

    //attemp: number = 0;
    //FIRST ADS========================================
    public PreloadFirstAd() {
        console.log('Preload first inter ad');
        if (this.FBInstant == null) {
            return;
        }
        if (this.preloadFirstInterstitialAd != null) {
            return;
        }
        let self = this;
        this.FBInstant.getInterstitialAdAsync(
            self.first_interstitial_ads_id
        ).then((interstitial) => {
            self.preloadFirstInterstitialAd = interstitial;
            return self.preloadFirstInterstitialAd.loadAsync();
        }).then(() => {
            console.log('First Interstitial preloaded')
            setTimeout(() => {
                this.ShowFirstInterstitial();
            }, 1000);
        }).catch((err) => {
            console.log('Interstitial error');
        })

    }
    public ShowFirstInterstitial(callback = null) {

        if (this.FBInstant == null) {
            if (callback != null)
                callback(true);
            return;
        }
        if (this.preloadFirstInterstitialAd == null) {
            if (callback != null)
                callback(false);
            return;

        }
        let self = this;
        this.preloadFirstInterstitialAd.showAsync()
            .then(() => {
                //show first ad
                console.log('Show first ad');
                self.preloadFirstInterstitialAd = null
                //show once time only
                //self.PreloadFirstAd();
                if (callback != null)
                    callback(true);
            })
            .catch((e) => {
                console.error('Ad error' + e.message);
                // self.preloadFirstInterstitialAd == null;
                // self.PreloadFirstAd();
                // if (callback != null)
                //     callback(false);
            });

    }
    //FIRST ADS ========================================
    public PreloadInterstitial() {
        console.log('Preload inter ad');
        if (this.FBInstant == null) {
return;
        }
        if (this.preloadInterstitialAd != null) {
            return;
        }
        let self = this;
        this.FBInstant.getInterstitialAdAsync(
            self.interstitial_ads_id
        ).then((interstitial) => {
            // Load the Ad asynchronously
            //self.attemp = 0;
            self.preloadInterstitialAd = interstitial;
            return self.preloadInterstitialAd.loadAsync();

        }).then(() => {
            console.log('Interstitial preloaded')
        }).catch((err) => {
            console.log('Ads', err);
            self.preloadInterstitialAd = null;


        });
    }

    public readyInterstitial() {
        return this.preloadInterstitialAd != null;
    }
    //==========================ADS //========================== ///
    private LoadBannerGame() {
        this.base64 = playerPrefs.GetString("banner");
        if (this.base64 == "") {
            tool.GetBase64ByUrl("https://i.imgur.com/zGIa1Vz.jpg", (base64) => {
                this.base64 = base64;
                playerPrefs.GetString("banner", this.base64);
            });
        }
    }
    public Share(base64Img, textMess: string, callback = null) {
        console.log('Start share....');
        if (this.FBInstant == null) {
            if (callback != null) {
                callback()
            }
            return;
        }

        this.FBInstant.shareAsync({
            intent: 'REQUEST',
            image: base64Img,
            text: textMess,
            data: { myReplayData: '...' },
        }).then((result) => {
            console.log('Share result:' + result);
            if (callback != null) {
                callback()
            }
        }).catch((err) => {
            console.log('Share not completed', err);
            if (callback != null) {
                callback()
            }
        })

    }
    //share to friend
    public InviteFriend(cta: string, message: string, callback = null, base: string, err = null) {
        if (this.FBInstant == null) {
            callback.apply();
            return;
        }
        this.ChoosePlayer(() => {
            this.FBInstant.updateAsync({
                action: 'CUSTOM',
                cta: {
                    default: cta,
                    localizations: {
                        vi_VN: cta,
                        es_ES: cta,
                        en_US: cta,
                        es_LA: cta,
                        fr_FR: cta,
                        fr_CA: cta,
                        pt_PT: cta,
                        pt_BR: cta,
                        th_TH: cta,
                        id_ID: cta,
                        ar_AR: cta,
                    }
                },
                image: base,
                text: {
                    default: message,
                    localizations: {
                        vi_VN: message,
                        es_ES: message,
                        en_US: message,
es_LA: message,
                        fr_FR: message,
                        fr_CA: message,
                        pt_PT: message,
                        pt_BR: message,
                        th_TH: message,
                        id_ID: message,
                        ar_AR: message
                    }
                },
                template: 'Game',
                data: { myReplayData: '...' },
                strategy: 'IMMEDIATE',
                notification: "PUSH",
            })
                .then(() => {
                    if (callback != null)
                        callback(true);
                })
                .catch(() => {
                    if (callback != null)
                        callback(false);
                });;
        }, err);
    }
    //

    private ChoosePlayer(callback = null, err = null) {
        if (this.FBInstant != null) {
            this.FBInstant.context
                .chooseAsync({
                    minSize: 2,
                })
                .then(() => {
                    if (callback != null) {
                        callback.apply();
                    }
                })
                .catch(() => {
                    if (err != null) {
                        err.apply();
                    }
                });
        }
    }
    public Invite(cta: string, message: string, callback = null, err = null) {
        if (this.FBInstant == null) {
            //err();
            return;
        }
        this.ChoosePlayer(() => {
            this.FBInstant.updateAsync({
                action: 'CUSTOM',
                cta: {
                    default: cta,
                    localizations: {
                        vi_VN: cta,
                        es_ES: cta,
                        en_US: cta,
                        es_LA: cta,
                    }
                },
                image: this.base64,
                text: {
                    default: message,
                    localizations: {
                        vi_VN: message,
                        es_ES: message,
                        en_US: message,
                        es_LA: message,
                    }
                },
                template: 'Game',
                data: { myReplayData: '...' },
                strategy: 'IMMEDIATE',
                notification: "PUSH",
            })
                .then(() => {
                    console.log('invite success');
                    if (callback != null)
                        callback.apply();
                })
                .catch(() => {
                    console.log('invite err');
                    err();
                });;
        }, err);
    }
    //
    public followPage() {
        if (this.FBInstant == null) return;
        const follow = () => {
            this.FBInstant.community.followOfficialPageAsync().then((data) => {
                console.log('Data:', data);
firebasesdk.instance.LogEvent('open_followpage_gui');
            }).catch((e) => {
                console.log('Err:', e);
            });
        }
        firebasesdk.instance.LogEvent('click_followpage');
        this.FBInstant.community.canFollowOfficialPageAsync()
            .then(function (data) {
                follow();
            });
        //

        //
    }
    public joinGroup() {
        console.log('Start join group');
        if (this.FBInstant == null) return;

        const follow = () => {
            this.FBInstant.community.joinOfficialGroupAsync().then((data) => {
                console.log('Data:', data);
            }).catch((e) => {
                console.log('Err:', e);
            })
        }

        this.FBInstant.community.canJoinOfficialGroupAsync()
            .then(function (data) {
                console.log(data);
                follow();
            });
    }
    //
    public submitFeedback(content: string, callback) {
        console.log('Submit feedback', content);
        if (this.FBInstant == null || content == '') return;
        let locale = this.FBInstant.getLocale();
        this.FBInstant.setSessionData({
            isFeedback: true,
            game_name: 'dressupgirl',
            user_locale: locale,
            language: '',
            gameLevel: '',
            feedbackContent: content
        });
        callback();
    }

    public sendFirstNotification(gameName: string = 'dressupgirl') {
        console.log('First time....')
        if (this.FBInstant == null) return;
        this.FBInstant.setSessionData({
            isFirstPlay: true,
            game_name: gameName,
        });
    }

    public SwitchGame(idGame, from: string) {
        if (this.FBInstant == null) return;
        // this.FBInstant.switchGameAsync(
        //     idGame,
        //     { referrer: PlayerPrefs.idGame, source: from },
        // ).catch((e) => {
        //     console.log(e.message);
        // });
    }


    // update (dt) {}
}
var locale = FBInstant.getLocale();