//import { logger } from "../polyfill";
import appDialogsManager from "../../lib/appManagers/appDialogsManager";
import { findUpTag, findUpClassName, formatNumber } from "../../lib/utils";
import appImManager from "../../lib/appManagers/appImManager";
import AppSearch, { SearchGroup } from "../appSearch";
import { parseMenuButtonsTo } from "../misc";
import appUsersManager from "../../lib/appManagers/appUsersManager";
import { ScrollableX } from "../scrollable";
import AvatarElement from "../avatar";
import AppNewChannelTab from "./tabs/newChannel";
import AppAddMembersTab from "./tabs/addMembers";
import AppContactsTab from "./tabs/contacts";
import AppNewGroupTab from "./tabs/newGroup";
import AppSettingsTab from "./tabs/settings";
import AppEditProfileTab from "./tabs/editProfile";
import AppChatFoldersTab from "./tabs/chatFolders";
import AppEditFolderTab from "./tabs/editFolder";
import AppIncludedChatsTab from "./tabs/includedChats";
import SidebarSlider from "../slider";
import SearchInput from "../searchInput";
import appStateManager from "../../lib/appManagers/appStateManager";
import appChatsManager from "../../lib/appManagers/appChatsManager";
import { MOUNT_CLASS_TO } from "../../lib/mtproto/mtproto_config";
import $rootScope from "../../lib/rootScope";
import appPeersManager from "../../lib/appManagers/appPeersManager";
import AppArchivedTab from "./tabs/archivedTab";

AvatarElement;

const newChannelTab = new AppNewChannelTab();
const addMembersTab = new AppAddMembersTab();
const contactsTab = new AppContactsTab();
const newGroupTab = new AppNewGroupTab();
const settingsTab = new AppSettingsTab();
const editProfileTab = new AppEditProfileTab();
const chatFoldersTab = new AppChatFoldersTab();
const editFolderTab = new AppEditFolderTab();
const includedChatsTab = new AppIncludedChatsTab();
const archivedTab = new AppArchivedTab();

export class AppSidebarLeft extends SidebarSlider {
  public static SLIDERITEMSIDS = {
    archived: 1,
    contacts: 2,
    newChannel: 3,
    addMembers: 4,
    newGroup: 5,
    settings: 6,
    editProfile: 7,
    chatFolders: 8,
    editFolder: 9,
    includedChats: 10,
  };

  private toolsBtn: HTMLButtonElement;
  private backBtn: HTMLButtonElement;
  private searchContainer: HTMLDivElement;
  //private searchInput = document.getElementById('global-search') as HTMLInputElement;
  private searchInput: SearchInput;
  
  private menuEl: HTMLElement;
  private buttons: {
    newGroup: HTMLButtonElement,
    contacts: HTMLButtonElement,
    archived: HTMLButtonElement,
    saved: HTMLButtonElement,
    settings: HTMLButtonElement,
    help: HTMLButtonElement
  } = {} as any;
  public archivedCount: HTMLSpanElement;

  private newBtnMenu: HTMLElement;
  private newButtons: {
    channel: HTMLButtonElement,
    group: HTMLButtonElement,
    privateChat: HTMLButtonElement,
  } = {} as any;

  public archivedTab: AppArchivedTab;
  public newChannelTab: AppNewChannelTab;
  public addMembersTab: AppAddMembersTab;
  public contactsTab: AppContactsTab;
  public newGroupTab: AppNewGroupTab;
  public settingsTab: AppSettingsTab;
  public editProfileTab: AppEditProfileTab;
  public chatFoldersTab: AppChatFoldersTab;
  public editFolderTab: AppEditFolderTab;
  public includedChatsTab: AppIncludedChatsTab;

  //private log = logger('SL');

  private searchGroups: {[k in 'contacts' | 'globalContacts' | 'messages' | 'people' | 'recent']: SearchGroup} = {} as any;
  private globalSearch: AppSearch;

  // peerIDs
  private recentSearch: number[] = [];
  private recentSearchLoaded = false;
  private recentSearchClearBtn: HTMLElement;

  constructor() {
    super(document.getElementById('column-left') as HTMLDivElement, {
      [AppSidebarLeft.SLIDERITEMSIDS.archived]: archivedTab,
      [AppSidebarLeft.SLIDERITEMSIDS.newChannel]: newChannelTab,
      [AppSidebarLeft.SLIDERITEMSIDS.contacts]: contactsTab,
      [AppSidebarLeft.SLIDERITEMSIDS.addMembers]: addMembersTab,
      [AppSidebarLeft.SLIDERITEMSIDS.newGroup]: newGroupTab,
      [AppSidebarLeft.SLIDERITEMSIDS.settings]: settingsTab,
      [AppSidebarLeft.SLIDERITEMSIDS.editProfile]: editProfileTab,
      [AppSidebarLeft.SLIDERITEMSIDS.chatFolders]: chatFoldersTab,
      [AppSidebarLeft.SLIDERITEMSIDS.editFolder]: editFolderTab,
      [AppSidebarLeft.SLIDERITEMSIDS.includedChats]: includedChatsTab,
    });

    //this._selectTab(0); // make first tab as default

    this.searchInput = new SearchInput('Telegram Search');
    this.sidebarEl.querySelector('.item-main .sidebar-header').append(this.searchInput.container);

    this.toolsBtn = this.sidebarEl.querySelector('.sidebar-tools-button') as HTMLButtonElement;
    this.backBtn = this.sidebarEl.querySelector('.sidebar-back-button') as HTMLButtonElement;
    this.searchContainer = this.sidebarEl.querySelector('#search-container') as HTMLDivElement;

    this.archivedTab = archivedTab;
    this.newChannelTab = newChannelTab;
    this.addMembersTab = addMembersTab;
    this.contactsTab = contactsTab;
    this.newGroupTab = newGroupTab;
    this.settingsTab = settingsTab;
    this.editProfileTab = editProfileTab;
    this.chatFoldersTab = chatFoldersTab;
    this.editFolderTab = editFolderTab;
    this.includedChatsTab = includedChatsTab;

    this.menuEl = this.toolsBtn.querySelector('.btn-menu');
    this.newBtnMenu = this.sidebarEl.querySelector('#new-menu');

    this.searchInput.input.addEventListener('focus', () => {
      this.searchGroups = {
        //saved: new SearchGroup('', 'contacts'),
        contacts: new SearchGroup('Chats', 'contacts'),
        globalContacts: new SearchGroup('Global Search', 'contacts'),
        messages: new SearchGroup('Global Search', 'messages'),
        people: new SearchGroup('People', 'contacts', false, 'search-group-people'),
        recent: new SearchGroup('Recent', 'contacts', false, 'search-group-recent')
      };

      this.globalSearch = new AppSearch(this.searchContainer, this.searchInput, this.searchGroups, (count) => {
        if(!count && !this.searchInput.value.trim()) {
          this.globalSearch.reset();
          this.searchGroups.people.setActive();
          this.renderRecentSearch();
        }
      });
      this.searchContainer.addEventListener('click', (e) => {
        const target = findUpTag(e.target, 'LI') as HTMLElement;
        if(!target) {
          return;
        }
  
        const searchGroup = findUpClassName(target, 'search-group');
        if(!searchGroup || searchGroup.classList.contains('search-group-recent') || searchGroup.classList.contains('search-group-people')) {
          return;
        }
  
        const peerID = +target.getAttribute('data-peerID');
        if(this.recentSearch[0] != peerID) {
          this.recentSearch.findAndSplice(p => p == peerID);
          this.recentSearch.unshift(peerID);
          if(this.recentSearch.length > 20) {
            this.recentSearch.length = 20;
          }
  
          this.renderRecentSearch();
          appStateManager.pushToState('recentSearch', this.recentSearch);
          for(const peerID of this.recentSearch) {
            appStateManager.setPeer(peerID, appPeersManager.getPeer(peerID));
          }
  
          clearRecentSearchBtn.style.display = '';
        }
      }, {capture: true});

      let peopleContainer = document.createElement('div');
      peopleContainer.classList.add('search-group-scrollable');
      peopleContainer.append(this.searchGroups.people.list);
      this.searchGroups.people.container.append(peopleContainer);
      let peopleScrollable = new ScrollableX(peopleContainer);

      appUsersManager.getTopPeers().then(peers => {
        //console.log('got top categories:', categories);
        peers.forEach((peerID) => {
          let {dialog, dom} = appDialogsManager.addDialog(peerID, this.searchGroups.people.list, false, true, true);
    
          this.searchGroups.people.setActive();
        });
      });

      const onFocus = () => {
        this.toolsBtn.classList.remove('active');
        this.backBtn.classList.add('active');
        this.searchContainer.classList.remove('hide');
        void this.searchContainer.offsetWidth; // reflow
        this.searchContainer.classList.add('active');

        if(firstTime) {
          this.searchGroups.people.setActive();
          this.renderRecentSearch();
          firstTime = false;
        }

        /* this.searchInput.addEventListener('blur', (e) => {
          if(!this.searchInput.value) {
            this.toolsBtn.classList.add('active');
            this.backBtn.classList.remove('active');
            this.backBtn.click();
          }
        }, {once: true}); */
      };

      let firstTime = true;
      this.searchInput.input.addEventListener('focus', onFocus);
      onFocus();

      this.backBtn.addEventListener('click', (e) => {
        //appDialogsManager.chatsArchivedContainer.classList.remove('active');
        this.toolsBtn.classList.add('active');
        this.backBtn.classList.remove('active');
        this.searchContainer.classList.remove('active');
        firstTime = true;

        setTimeout(() => {
          this.searchContainer.classList.add('hide');
          this.globalSearch.reset();
        }, 150);
      });

      this.renderRecentSearch();
      const clearRecentSearchBtn = this.recentSearchClearBtn = document.createElement('button');
      clearRecentSearchBtn.classList.add('btn-icon', 'tgico-close');
      this.searchGroups.recent.nameEl.append(clearRecentSearchBtn);
      clearRecentSearchBtn.addEventListener('click', () => {
        this.recentSearch = [];
        appStateManager.pushToState('recentSearch', this.recentSearch);
        this.renderRecentSearch(false);
        clearRecentSearchBtn.style.display = 'none';
      });
    }, {once: true});

    parseMenuButtonsTo(this.buttons, this.menuEl.children);
    parseMenuButtonsTo(this.newButtons, this.newBtnMenu.firstElementChild.children);

    this.archivedCount = this.buttons.archived.querySelector('.archived-count') as HTMLSpanElement;

    this.buttons.saved.addEventListener('click', (e) => {
      ///////this.log('savedbtn click');
      setTimeout(() => { // menu doesn't close if no timeout (lol)
        appImManager.setPeer(appImManager.myID);
      }, 0);
    });
    
    this.buttons.archived.addEventListener('click', (e) => {
      this.selectTab(AppSidebarLeft.SLIDERITEMSIDS.archived);
    });

    this.buttons.contacts.addEventListener('click', (e) => {
      this.contactsTab.openContacts();
    });

    this.buttons.settings.addEventListener('click', (e) => {
      this.settingsTab.fillElements();
      this.selectTab(AppSidebarLeft.SLIDERITEMSIDS.settings);
    });

    this.newButtons.channel.addEventListener('click', (e) => {
      this.selectTab(AppSidebarLeft.SLIDERITEMSIDS.newChannel);
    });

    [this.newButtons.group, this.buttons.newGroup].forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.addMembersTab.init(0, 'chat', false, (peerIDs) => {
          this.newGroupTab.init(peerIDs);
        });
      });
    });

    $rootScope.$on('dialogs_archived_unread', (e) => {
      this.archivedCount.innerText = '' + formatNumber(e.detail.count, 1);
    });

    appUsersManager.getTopPeers();
  }

  public renderRecentSearch(setActive = true) {
    appStateManager.getState().then(state => {
      if(state && !this.recentSearchLoaded && Array.isArray(state.recentSearch)) {
        this.recentSearch = state.recentSearch;
        this.recentSearchLoaded = true;
      }

      this.searchGroups.recent.list.innerHTML = '';
      this.recentSearchClearBtn.style.display = this.recentSearch.length ? '' : 'none';

      this.recentSearch.slice(0, 20).forEach(peerID => {
        let {dialog, dom} = appDialogsManager.addDialog(peerID, this.searchGroups.recent.list, false, true, false, true);

        dom.lastMessageSpan.innerText = peerID > 0 ? appUsersManager.getUserStatusString(peerID) : appChatsManager.getChatMembersString(peerID);
      });

      if(setActive) {
        this.searchGroups.recent.setActive();
      }
    });
  }
}

const appSidebarLeft = new AppSidebarLeft();
MOUNT_CLASS_TO && (MOUNT_CLASS_TO.appSidebarLeft = appSidebarLeft);
export default appSidebarLeft;