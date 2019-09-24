var nodemailer = require('nodemailer');
async function sendMail(content) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let transporter = nodemailer.createTransport({
        host: 'smtp.qq.com',
        port: 587,
        auth: {
          user: '329103586',
          pass: 'worxrtnddypdbibb'
        }
      });
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '329103586@qq.com', // sender address
        to: '329103586@qq.com', // list of receivers
        subject: content, // Subject line
        text: 'Hello world?', // plain text body
        html: '<b>Hello world?</b>' // html body
    });

    console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
exports.sendMail = sendMail;