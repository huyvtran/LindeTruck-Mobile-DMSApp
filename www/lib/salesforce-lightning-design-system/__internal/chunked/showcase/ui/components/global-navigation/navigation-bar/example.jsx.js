var SLDS=SLDS||{};SLDS["__internal/chunked/showcase/ui/components/global-navigation/navigation-bar/example.jsx.js"]=webpackJsonpSLDS___internal_chunked_showcase([61,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139],{0:function(e,t){e.exports=React},94:function(e,t,a){"use strict";function l(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.states=t.Context=t.ContextBar=void 0;var s=l(a(0)),n=l(a(2)),c=a(8),r=a(3),d=a(29),m=l(a(1)),i=l(a(4)),u=s.default.createElement(c.Menu,{className:"slds-dropdown_right"},s.default.createElement(c.MenuList,null,s.default.createElement(c.MenuItem,null,s.default.createElement(n.default,{className:"slds-icon slds-icon_x-small slds-icon-text-default slds-m-right_x-small",sprite:"utility",symbol:"add"}),"Main action"),s.default.createElement("li",{className:"slds-dropdown__header slds-has-divider_top-space",role:"separator"},s.default.createElement("span",{className:"slds-text-title_caps"},"Menu header")),s.default.createElement(c.MenuItem,null,"Menu Item One"),s.default.createElement(c.MenuItem,null,"Menu Item Two"),s.default.createElement(c.MenuItem,null,"Menu Item Three"))),o=t.ContextBar=function(e){return s.default.createElement("div",{className:(0,m.default)("slds-context-bar",e.className)},s.default.createElement("div",{className:"slds-context-bar__primary"},s.default.createElement("div",{className:"slds-context-bar__item slds-context-bar__dropdown-trigger slds-dropdown-trigger slds-dropdown-trigger_click slds-no-hover"},s.default.createElement("div",{className:"slds-context-bar__icon-action"},s.default.createElement(d.WaffleIcon,{className:"slds-context-bar__button"})),s.default.createElement("span",{className:"slds-context-bar__label-action slds-context-bar__app-name"},s.default.createElement("span",{className:"slds-truncate",title:e.appName||"App Name"},e.stencil?"🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢":e.appName||"App Name")))),s.default.createElement("nav",{className:"slds-context-bar__secondary",role:"navigation"},s.default.createElement("ul",{className:"slds-grid"},s.default.createElement("li",{className:"slds-context-bar__item"},s.default.createElement("a",{href:"javascript:void(0);",className:"slds-context-bar__label-action",title:"Home"},s.default.createElement("span",{className:"slds-truncate",title:"Home"},e.stencil?"🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢":"Home"))),s.default.createElement("li",{className:"slds-context-bar__item slds-context-bar__dropdown-trigger slds-dropdown-trigger slds-dropdown-trigger_hover"},s.default.createElement("a",{href:"javascript:void(0);",className:"slds-context-bar__label-action",title:"Menu Item"},s.default.createElement("span",{className:"slds-truncate",title:"Menu Item"},e.stencil?"🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢":"Menu Item")),s.default.createElement("div",{className:"slds-context-bar__icon-action slds-p-left_none"},s.default.createElement(r.ButtonIcon,{className:"slds-button_icon slds-context-bar__button",symbol:"chevrondown","aria-haspopup":"true",assistiveText:"Open menu item submenu",title:"Open menu item submenu"})),e.hideDropdown?null:u),e.children?e.children:i.default.times(3,function(t){return s.default.createElement("li",{className:"slds-context-bar__item",key:t},s.default.createElement("a",{href:"javascript:void(0);",className:"slds-context-bar__label-action",title:"Menu Item"},s.default.createElement("span",{className:"slds-truncate",title:"Menu Item"},e.stencil?"🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢🁢":"Menu Item")))}))))};t.Context=function(e){return s.default.createElement("div",{style:{height:"16rem"}},e.children)};t.default=s.default.createElement(o,{itemActive:!0});t.states=[{id:"item-active",label:"Item Active",element:s.default.createElement(o,null,s.default.createElement("li",{className:"slds-context-bar__item slds-is-active"},s.default.createElement("a",{href:"javascript:void(0);",className:"slds-context-bar__label-action",title:"Menu Item"},s.default.createElement("span",{className:"slds-assistive-text"},"Current Page:"),s.default.createElement("span",{className:"slds-truncate",title:"Menu Item"},"Menu Item"))),i.default.times(2,function(e){return s.default.createElement("li",{className:"slds-context-bar__item",key:e},s.default.createElement("a",{href:"javascript:void(0);",className:"slds-context-bar__label-action",title:"Menu Item "+e},s.default.createElement("span",{className:"slds-truncate",title:"Menu Item"},"Menu Item")))}))}]}},[94]);