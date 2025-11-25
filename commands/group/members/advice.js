import axios from 'axios';

const handler = async (sock, msg, from, args, msgInfoObj) => {
    const { sendMessageWTyping } = msgInfoObj;
    try {
        const res = await axios(`https://api.adviceslip.com/advice`);
        sendMessageWTyping(from, { text: `_*-Advice-*_ \n\n` + res.data.slip.advice }, { quoted: msg });
    } catch (error) {
        console.error('Error in axios request:', error);
        sendMessageWTyping(from, { text: error.toString() }, { quoted: msg });
    }
};

export default () => ({
    cmd: ['advice'],
    desc: 'Get random advice',
    usage: 'advice',
    handler
});
