import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { htmlSafe } from "@ember/template";
import getURL from "discourse-common/lib/get-url";
import I18n from "I18n";

export default class ChatMentionWarnings extends Component {
  @service siteSettings;
  @service currentUser;
  @service chatComposerWarningsTracker;

  get unreachableGroupMentions() {
    return this.chatComposerWarningsTracker.unreachableGroupMentions;
  }

  get overMembersLimitGroupMentions() {
    return this.chatComposerWarningsTracker.overMembersLimitGroupMentions;
  }

  get hasTooManyMentions() {
    return this.chatComposerWarningsTracker.tooManyMentions;
  }

  get channelWideMentionDisallowed() {
    return this.chatComposerWarningsTracker.channelWideMentionDisallowed;
  }

  get mentionsCount() {
    return this.chatComposerWarningsTracker.mentionsCount;
  }

  get unreachableGroupMentionsCount() {
    return this.unreachableGroupMentions.length;
  }

  get overMembersLimitMentionsCount() {
    return this.overMembersLimitGroupMentions.length;
  }

  get hasUnreachableGroupMentions() {
    return this.unreachableGroupMentionsCount > 0;
  }

  get hasOverMembersLimitGroupMentions() {
    return this.overMembersLimitMentionsCount > 0;
  }

  get warningsCount() {
    return (
      this.unreachableGroupMentionsCount + this.overMembersLimitMentionsCount
    );
  }

  get show() {
    return (
      this.hasTooManyMentions ||
      this.channelWideMentionDisallowed ||
      this.hasUnreachableGroupMentions ||
      this.hasOverMembersLimitGroupMentions
    );
  }

  get listStyleClass() {
    if (this.hasTooManyMentions) {
      return "chat-mention-warnings-list__simple";
    }

    if (this.warningsCount > 1) {
      return "chat-mention-warnings-list__multiple";
    } else {
      return "chat-mention-warnings-list__simple";
    }
  }

  get warningHeaderText() {
    if (this.mentionsCount <= this.warningsCount || this.hasTooManyMentions) {
      return I18n.t("chat.mention_warning.groups.header.all");
    } else {
      return I18n.t("chat.mention_warning.groups.header.some");
    }
  }

  get tooManyMentionsBody() {
    if (!this.hasTooManyMentions) {
      return;
    }

    if (this.currentUser.admin) {
      return htmlSafe(
        I18n.t("chat.mention_warning.too_many_mentions_admin", {
          count: this.siteSettings.max_mentions_per_chat_message,
          siteSettingUrl: getURL(
            "/admin/site_settings/category/plugins?filter=max_mentions_per_chat_message"
          ),
        })
      );
    } else {
      return htmlSafe(
        I18n.t("chat.mention_warning.too_many_mentions", {
          count: this.siteSettings.max_mentions_per_chat_message,
        })
      );
    }
  }

  get unreachableBody() {
    if (!this.hasUnreachableGroupMentions) {
      return;
    }

    switch (this.unreachableGroupMentionsCount) {
      case 1:
        return I18n.t("chat.mention_warning.groups.unreachable_1", {
          group: this.unreachableGroupMentions[0],
        });
      case 2:
        return I18n.t("chat.mention_warning.groups.unreachable_2", {
          group1: this.unreachableGroupMentions[0],
          group2: this.unreachableGroupMentions[1],
        });
      default:
        return I18n.t("chat.mention_warning.groups.unreachable_multiple", {
          group: this.unreachableGroupMentions[0],
          count: this.unreachableGroupMentionsCount - 1,
        });
    }
  }

  get overMembersLimitBody() {
    if (!this.hasOverMembersLimitGroupMentions) {
      return;
    }

    return htmlSafe(
      I18n.messageFormat("chat.mention_warning.groups.too_many_members_MF", {
        groupCount: this.overMembersLimitMentionsCount,
        isAdmin: this.currentUser.admin,
        siteSettingUrl: getURL(
          "/admin/site_settings/category/plugins?filter=max_users_notified_per_group_mention"
        ),
        notificationLimit:
          this.siteSettings.max_users_notified_per_group_mention,
        group1: this.overMembersLimitGroupMentions[0],
        group2: this.overMembersLimitGroupMentions[1],
      })
    );
  }
}
