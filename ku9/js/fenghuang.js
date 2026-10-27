/* 凤凰秀电视直播。ES5 / 同步 Ku9，使用官网匿名播放接口获取临时签名。 */
function main(item) {
    var source = item && item.url ? String(item.url) : String(item || '');
    var id = ku9.getQuery(source, 'id') || 'pcc';
    // 兼容已导入的旧频道表；这个风直播活动 ID 已不再代表中文台。
    if (id === '1016529') id = 'pcc';
    var channels = [
        ['pcc', 'f7f48462-9b13-485b-8101-7b54716411ec', '凤凰中文台'],
        ['pin', '7c96b084-60e1-40a9-89c5-682b994fb680', '凤凰资讯台'],
        ['phk', '15e02d92-1698-416c-af2f-3e9a872b4d78', '凤凰香港台']
    ];
    var channel = null;
    for (var i = 0; i < channels.length; i++) {
        if (id === channels[i][0] || id === channels[i][1]) channel = channels[i];
    }
    if (!channel) throw new Error('凤凰频道参数无效：' + id);
    var quality = ku9.getQuery(source, 'quality') || 'hd';
    if (quality !== 'hd' && quality !== 'sd') throw new Error('凤凰清晰度参数无效：' + quality);
    var page = 'https://www.fengshows.com/live';
    var userAgent = 'Mozilla/5.0';
    var response = ku9.request('https://m.fengshows.com/api/v3/hub/live/auth-url?live_qa='
            + quality + '&live_id=' + channel[1], 'GET', {
        'Referer': page, 'Origin': 'https://www.fengshows.com',
        'User-Agent': userAgent, 'Accept': 'application/json'
    });
    if (!response || Number(response.code) !== 200) {
        throw new Error('凤凰播放接口请求失败：HTTP ' + (response ? response.code : 0));
    }
    var data;
    try { data = JSON.parse(response.body); }
    catch (error) { throw new Error('凤凰播放接口未返回有效 JSON'); }
    if (!data || String(data.status) !== '0') {
        throw new Error('凤凰播放接口异常：' + (data && data.message || '未知错误'));
    }
    var url = data.data && data.data.live_url;
    var match = typeof url === 'string' && url.match(
            /^https?:\/\/[^\/\s?#]+(\/live\/0701(pcc|pin|phk)[0-9]+\.flv\?[^\s#]+)$/i);
    if (!match || match[2] !== channel[0]
            || !/[?&]txSecret=[a-f0-9]{32}(?:&|$)/i.test(url)
            || !/[?&]txTime=[a-f0-9]+(?:&|$)/i.test(url)) {
        throw new Error('凤凰频道缺少有效的签名播放地址：' + channel[2]);
    }
    // 原样使用接口下发的主机与全部参数：国内 dispatch.fengshows.cn:8484 可直连，
    // 301 跳 qctv.fengshows.cn 后即为 FLV 直播流。不要改成 tlive，该域名国内 403。
    return {url: url, referer: page, userAgent: userAgent};
}
