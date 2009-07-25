/*
 * Copyright 2009 Rohit Pidaparthi
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Author: Rohit Pidaparthi <rohitpid@gmail.com>
 *
 */

$(document).ready(function(){  
  $("#dialog").dialog({ autoOpen: false });
  $("a#dialog_link").click(function(){$("#dialog").dialog("open");});
  $("#dialog2").dialog({ autoOpen: false });
  $("a#dialog_link2").click(function(){$("#dialog2").dialog("open");});
});
