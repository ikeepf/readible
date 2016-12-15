$.ajax({
    url: "http://www.tuniu.com/tax/opl",
    type:"GET",
    dataType:"json",
    async: false,
    data: {},
    success: function (response) {
        var $openBtn = $('#openBtn');
        if (response.success == true) {
            if (response.data.isLogin == true) {
                if (response.data.isOpen == true) {
                    $openBtn.text('我的首付出发');
                    $openBtn.attr('href', 'https://8.m.tuniu.com/xdm/m/index/main');
                }
            }
            else {

            }
        }
        else {
            console.log(response);
        }
    }
});