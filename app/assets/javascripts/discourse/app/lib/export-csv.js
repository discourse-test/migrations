import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { getOwnerWithFallback } from "discourse-common/lib/get-owner";
import I18n from "I18n";

function exportEntityByType(type, entity, args) {
  return ajax("/export_csv/export_entity.json", {
    type: "POST",
    data: { entity, args },
  });
}

export function exportUserArchive() {
  const dialog = getOwnerWithFallback(this).lookup("service:dialog");
  return exportEntityByType("user", "user_archive")
    .then(function () {
      dialog.alert(I18n.t("user.download_archive.success"));
    })
    .catch(popupAjaxError);
}

export function exportEntity(entity, args) {
  return exportEntityByType("admin", entity, args);
}
