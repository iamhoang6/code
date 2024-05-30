'use strict'

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

$('.form_autoSmit').submit(function (event) {
    event.preventDefault();
    var redirs = ($(this).attr('redirect')) ? $(this).attr('redirect') : window.location.href;
    var button = event.target.querySelector('.form_smit_btn') || document.querySelector('.form_smit_btn');
    var alertSuccess = $(this).attr('alertSuccess')
    var delay = $(this).attr('delay')
    var buttonText = button.innerText
    
    try {
        button.setAttribute("disabled", "");
        button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> ${$(this).attr('btnMsg')}`
    } catch (e) {
        void(0);
    }

    $.ajax({
        method: $(this).attr('method'),
        url: $(this).attr('action'),
        data: $(this).serialize(),
        headers: {
            "Authorization": "Bearer " + $(this).attr('api-token')
        },
        success: function (response) {
            var data = response;
            if (data.success == true) {

                if (alertSuccess !== "no") {
                    Swal.fire('Thành công', data.message, 'success');
                }

                

                

                if (redirs) {
                    setTimeout(function () {
                        window.location.href = redirs;
                    }, (delay) ? Number(delay) : 2000);
                }

                
            } else {
                Swal.fire('Thất bại', data.message, 'error');
            }
            try {
                button.innerText  = buttonText
                button.removeAttribute("disabled");
            } catch (e) {
                void(0);
            }
            
        },
        error: function (xhr) {
            if (!isJsonString(xhr.responseText)) {
                Swal.fire('Lỗi', 'Có lỗi xảy ra !', 'error');
                try {
                    button.innerText  = buttonText
                    button.removeAttribute("disabled");
                } catch (e) {
                    void(0);
                }
                
            }
            var data = JSON.parse(xhr.responseText);
            if (data.success !== true) {
                Swal.fire('Lỗi', data.message, 'error');
            } else {
                Swal.fire('Thành công', data.message, 'success');
                setTimeout(function () {
                    window.location.href = redirs;
                }, (delay) ? Number(delay) : 2000);
            }
            try {
                button.innerText  = buttonText
                button.removeAttribute("disabled");
            } catch (e) {
                void(0);
            }
            
        }
    })
});