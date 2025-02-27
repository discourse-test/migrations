import { htmlSafe } from "@ember/template";
import ReviewableTypeBase from "discourse/lib/reviewable-types/base";
import { emojiUnescape } from "discourse/lib/text";
import { escapeExpression } from "discourse/lib/utilities";
import I18n from "I18n";

export default class extends ReviewableTypeBase {
  get actor() {
    return I18n.t("user_menu.reviewable.queue");
  }

  get description() {
    let title = this.reviewable.topic_fancy_title;
    if (!title) {
      title = escapeExpression(this.reviewable.payload_title);
    }
    title = emojiUnescape(title);
    if (this.reviewable.is_new_topic) {
      return htmlSafe(title);
    } else {
      return htmlSafe(
        I18n.t("user_menu.reviewable.new_post_in_topic", {
          title,
        })
      );
    }
  }

  get icon() {
    return "layer-group";
  }
}
