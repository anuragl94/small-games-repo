$(document).ready(function () {
    var gameData = new Vue({
        el: '#game',
        data: {
            media_posts: [
                {
                    likes: 100,
                    likeStrength: 1
                }
            ]
        },
        methods: {
            updateLikes: function (index, value) {
                console.log("LOL", this);
                this.data.media_posts[index].likes += value;
            }
        }
    });
});