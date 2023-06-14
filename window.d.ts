/// <reference types="@nextcloud/typings" />

import { FileAction } from "./lib/fileAction";
import { NewFileMenu } from "./lib/newFileMenu";

export {};

declare global {
    interface Window {
        OC: Nextcloud.v25.OC | Nextcloud.v26.OC | Nextcloud.v27.OC;
        _nc_newfilemenu: NewFileMenu | undefined;
        _nc_fileactions: FileAction[] | undefined;
    }
}
