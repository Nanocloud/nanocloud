import Ember from 'ember';

/* global $:false */
var FileUploader = Ember.Object.extend(Ember.Evented, {
  completed: false,
  progress: 0,
  uploading: false,

  init() {
    this._super(...arguments);
    this.startUpload();
  },

  name: Ember.computed('file', function() {
    return this.get('file').name;
  }),

  startUpload() {
    let req = new XMLHttpRequest();

    this.set('req', req);

    req.open('POST', '/upload?filename=' + encodeURIComponent(this.get('file').name));
    req.setRequestHeader('Authorization', 'Bearer ' + this.get('token'));

    req.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        let p = event.loaded / event.total;
        if (p === 1) {
          this.set('uploading', false);
        }
        this.set('progress', Math.round(event.loaded / event.total * 100));
      }
    };

    req.onload = () => {
      this.set('completed', true);
      this.trigger('completed');
      this.set('uploading', false);
    };

    this.set('uploading', true);
    req.send(this.get('file'));
  },

  cancel(preventEvent) {
    this.get('req').abort();
    this.set('uploading', false);

    if (!preventEvent) {
      this.trigger('canceled');
    }
  }
});

export default Ember.Component.extend({
  classNames: ['vdi-drag-n-drop'],
  classNameBindings: ['show:state-show:state-hide'],
  session: Ember.inject.service('session'),

  progress: Ember.computed('queue.@each.uploading', 'queue.@each.progress', function() {
    let q = this.get('queue');
    let len = q.get('length');
    if (len) {
      return Math.round(q.filterBy('uploading').reduce((a, b) => a + b.get('progress'), 0) / q.get('length'));
    } else {
      return 0;
    }
  }),

  uploading: Ember.computed('queue.@each.uploading', function() {
    return this.get('queue').isAny('uploading');
  }),

  show: false,
  queue: null,
  state: null,

  init: function() {
    this._super(...arguments);
    Ember.$('body').off('dragenter dragover');
    this.set('queue', Ember.A([]));
  },

  showElement() {
    this.set('show', true);
  },

  hideElement() {
    this.set('show', false);
  },

  dragLeave() {
    this.set('dragAndDropActive', false);
    this.hideElement();
  },

  drop(event) {
    event.preventDefault();
    this.set('dragAndDropActive', false);
    this.hideElement();

    this.startDownload(event.dataTransfer.files);
  },

  startDownload(files){
    let q = this.get('queue');

    for (let i = 0; i < files.length; i++) {
      let f = FileUploader.create({
        file: files[i],
        token: this.get('session.access_token')
      });
      f.one('completed', this, () => {
        this.completeNotif();
      });

      f.one('canceled', this, this.abortNotif);
      q.pushObject(f);
    }
  },

  removeCompleteDownload() {
    let q = this.get('queue');
    let len = q.get('length');
    let i = 0;

    while (i < len) {
      if (!q.objectAt(i).get('uploading')) {
        q.removeAt(i);
        --len;
      } else {
        ++i;
      }
    }
  },

  didInsertElement() {
    Ember.$('body').on('dragenter dragover', (event) => {
      event.preventDefault();

      this.set('show', true);
      if (this.get('dragAndDropActive') === false) {
        this.set('dragAndDropActive', true);
        this.showElement();
      }
    });

    if (this.get('assignBrowse')) {
      var input = $('<input>', { type: "file" })
      .css({
        "visibility": "hidden",
        "position": "absolute",
        "width": "1px",
        "height": "1px"
      })
      .on('change', (event) => {
        this.startDownload(event.target.files);
      });
      $('.' + this.get('assignBrowse'))
        .after(input)
        .on('click', function() {
          input.click();
        });
    }
  },

  completeNotif() {
    this.sendAction('complete');
    this.toast.success('Upload successful');
  },

  abortNotif() {
    this.toast.info('Abort successful');
  },

  downloadCompleted() {
    if (this.get('state') !== 'Aborted') {
      this.completeNotif();

      this.set('state', 'Completed');
      Ember.run.next(() => {
        Ember.$('.state').fadeOut(700, () => {
          this.set('state', null);
          Ember.$('.state').fadeIn(0);
        });
      }, 3000);
    }
    else {
      this.set('state', null);
    }
  },

  stopUpload() {
    this.get('queue').invoke('cancel', true);
    this.abortNotif();
    this.set('state', 'Aborted');
    this.downloadCompleted();
  },

  actions: {
    cancelUpload() {
      this.stopUpload();
    },

    flushHistory() {
      this.removeCompleteDownload();
    }
  },
});
