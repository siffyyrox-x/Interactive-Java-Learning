public class MidE {
    public static void main(String[] args) {
        int i = 1, j = 8, value = 3, step = 0;
        boolean mode = false;
        while (step < 6) {
                if (mode) {
                    value += ++i + j--;
                    System.out.println(value--);
                } else {
                    value -= i++ - --j;
                    System.out.println(++value);
                }
                mode = !mode;
                step++;
        }
    }
}
