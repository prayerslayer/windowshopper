$(document).ready(function() {
    var $input = $('input[data-block="search-field"]');
    $input.on('input', function() {
        var val = $input.val();
        if (!!val) {
            $('[data-block="ui"]')
                .show()
                .not('[data-id*="' + val + '"]')
                .hide();
        } else {
            $('[data-block="ui"]')
                .show();
        }
    });
});