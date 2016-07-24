import Ember from 'ember';

export default Ember.Component.extend({
  isVisible: false,
  session: Ember.inject.service('session'),
  store: Ember.inject.service('store'),
  publishError: false,

  files: Ember.computed(function() {
    return (this.get('model'));
  }),

  historyData: Ember.computed('history_offset', function() {
    return (this.pathToArray());
  }),

  initialize: function() {

    this.reset();
    this.loadDirectory();
   
  }.on('becameVisible'),

  selectFile(file) {
    if (this.get('selectedFile') !== file) {
      this.set('selectedFile', file);
    }
    else {
      this.set('selectedFile', null);
    }
  },

  selectDir(dir) {
    this.incrementProperty('history_offset');
    this.goToDirectory(dir);
  },

  loadDirectory() {
    var path = this.pathToString();
    this.get('store').query('file', { filename: path })
      .then(function(response) {
        this.set('items', response);
      }.bind(this));
  },

  goToDirectory(folder) {

    // removing from current
    var offset = this.get('history_offset');
    this.get('history').splice(offset, this.get('history').length - offset);

    this.get('history').pushObject(folder);
    this.loadDirectory();
  },

  goBack() {
    if (this.get('history_offset') <= 0) {
      return;
    }
    this.decrementProperty('history_offset');
    this.loadDirectory();
  },

  goNext() {
    if ((this.get('history_offset')+1) >= this.get('history').length) {
      return;
    }
    this.incrementProperty('history_offset');
    this.loadDirectory();
  },

  pathToArray() {
    var data = this.get('history');
    var offset = this.get('history_offset');
    var path = [];
    for (var i = 0; i <= offset; i++) {
      path.pushObject(data[i]);
    }
    return (path);
  },
    
  pathToString() {
    
    var data = this.get('history');
    var offset = this.get('history_offset');
    var path = "";
    for (var i = 0; i <= offset; i++) {
      path += data[i] + "\\";
    }
    return (path);
  },

  publishSelectedFile() {

    let name = this.get('selectedFile').get('name').replace(/\.[^/.]+$/, "");

    let m = this.get('store').createRecord('application', {
      alias: name,
      displayName: name, 
      collectionName: "collection",
      path: this.fullPath(),
    });

    this.set('isPublishing', true);
    m.save()
      .then(() => {
        this.set('isPublishing', false);
        this.toggleProperty('isVisible');
        this.toast.success("Your application has been published successfully");
        if (this.get('publishDone')) {
          this.sendAction('publishDone');
        }
      }, (error) => {
        this.set('isPublishing', false);
        this.set('publishError', true);
        this.set('selectedFile', null);
        this.toast.error(error.errors[0].status + " : " + error.errors[0].title);
      });
  },

  fullPath() {
    return (this.pathToString() + this.get('selectedFile').get('name'));
  },

  reset() {
    this.set('history', [ "C:" ]);
    this.set('history_offset', 0);
    this.set('selectedFile', null);
  },

  actions: {

    moveOffset(offset) {
      this.set('history_offset', offset);
      this.loadDirectory();
    },

    toggleFileExplorer() {
      this.toggleProperty('isVisible');
    },

    clickItem(item) {
      if (item.get('type') === 'directory') {
        this.selectDir(item.get('name'));
        return;
      }

      this.selectFile(item);
    },

    clickPublish() {
      this.publishSelectedFile();
    },

    clickNextBtn() {
      this.goNext();
    },

    clickPrevBtn() {
      this.goBack();
    },
  }
});
