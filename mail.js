const nodemailer = require('nodemailer');
async function sendMail(content) {
    let transporter = nodemailer.createTransport({
        host: 'smtp.qq.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: '329103586@qq.com', // generated ethereal user
            pass: 'yroeoqjgjgtkcagc' // generated ethereal password
        }
    });

    let info = await transporter.sendMail({
        from: '"HT账户检测" <329103586@qq.com>', // sender address
        to: 'vipmagic@vip.qq.com, 329103586@qq.com', // list of receivers
        subject: content, // Subject line
        text: 'Hello world?', // plain text body
        html: '<b>Hello world?</b>' // html body
    });
}
exports.sendMail = sendMail;
