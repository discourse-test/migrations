import { h } from "virtual-dom";
import { number } from "discourse/lib/formatter";
import Category from "discourse/models/category";
import { createWidget } from "discourse/widgets/widget";
import getURL from "discourse-common/lib/get-url";
import I18n from "I18n";

createWidget("hamburger-category", {
  tagName: "li.category-link",

  html(c) {
    if (c.parent_category_id) {
      this.tagName += ".subcategory";
    }

    this.tagName += ".category-" + Category.slugFor(c, "-");

    const results = [
      this.attach("category-link", { category: c, allowUncategorized: true }),
    ];

    const unreadTotal = c.unreadTopicsCount + c.newTopicsCount;

    if (unreadTotal) {
      results.push(
        h(
          "a.badge.badge-notification",
          {
            attributes: { href: c.get("url") },
          },
          number(unreadTotal)
        )
      );
    }

    if (!this.currentUser) {
      let count;

      if (c.get("show_subcategory_list")) {
        count = c.get("totalTopicCount");
      } else {
        count = c.get("topic_count");
      }

      results.push(h("b.topics-count", number(count)));
    }

    return results;
  },
});

export default createWidget("hamburger-categories", {
  tagName: "ul.category-links.clearfix",

  html(attrs) {
    const href = getURL("/categories");
    let title = I18n.t("filters.categories.title");
    if (attrs.moreCount > 0) {
      title = I18n.t("categories.n_more", { count: attrs.moreCount });
    }

    let result = [
      h(
        "li.heading",
        h("a.d-link.categories-link", { attributes: { href } }, title)
      ),
    ];

    const categories = attrs.categories;
    if (categories.length === 0) {
      return;
    }
    result = result.concat(
      categories.map((c) => this.attach("hamburger-category", c))
    );

    return result;
  },
});
