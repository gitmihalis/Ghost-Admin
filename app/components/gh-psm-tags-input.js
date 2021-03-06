import Component from '@ember/component';
import {computed} from '@ember/object';
import {inject as service} from '@ember/service';

export default Component.extend({

    store: service(),

    // public attrs
    post: null,
    tagName: '',

    // internal attrs
    availableTags: null,

    availableTagNames: computed('availableTags.@each.name', function () {
        return this.get('availableTags').map(tag => tag.get('name').toLowerCase());
    }),

    init() {
        this._super(...arguments);
        // perform a background query to fetch all users and set `availableTags`
        // to a live-query that will be immediately populated with what's in the
        // store and be updated when the above query returns
        this.store.query('tag', {limit: 'all'});
        this.set('availableTags', this.store.peekAll('tag'));
    },

    actions: {
        matchTags(tagName, term) {
            return tagName.toLowerCase() === term.trim().toLowerCase();
        },

        hideCreateOptionOnMatchingTag(term) {
            return !this.get('availableTagNames').includes(term.toLowerCase());
        },

        updateTags(newTags) {
            let currentTags = this.get('post.tags');

            // destroy new+unsaved tags that are no longer selected
            currentTags.forEach(function (tag) {
                if (!newTags.includes(tag) && tag.get('isNew')) {
                    tag.destroyRecord();
                }
            });

            // update tags
            return this.set('post.tags', newTags);
        },

        createTag(tagName) {
            let currentTags = this.get('post.tags');
            let currentTagNames = currentTags.map(tag => tag.get('name').toLowerCase());
            let tagToAdd;

            tagName = tagName.trim();

            // abort if tag is already selected
            if (currentTagNames.includes(tagName.toLowerCase())) {
                return;
            }

            // add existing tag or create new one
            return this._findTagByName(tagName).then((matchedTag) => {
                tagToAdd = matchedTag;

                // create new tag if no match
                if (!tagToAdd) {
                    tagToAdd = this.get('store').createRecord('tag', {
                        name: tagName
                    });

                    // set to public/internal based on the tag name
                    tagToAdd.updateVisibility();
                }

                // push tag onto post relationship
                return currentTags.pushObject(tagToAdd);
            });
        }
    },

    // methods

    _findTagByName(name) {
        let withMatchingName = function (tag) {
            return tag.get('name').toLowerCase() === name.toLowerCase();
        };
        return this.get('availableTags').then(availableTags => availableTags.find(withMatchingName));
    }
});
